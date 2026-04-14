const axios = require('axios');
const MotorLog = require('../models/MotorLog');
const User = require('../models/User');
const MotorTimer = require('../models/MotorTimer'); // Added MotorTimer

// Hardcoded project keys — fallback so motor control works even before user saves API key in profile
const THINGSPEAK_WRITE_KEY = "5YD6MK03CUBJEHDI";
const THINGSPEAK_READ_KEY = "TNRHJH2DGPWOACJD";
const THINGSPEAK_CHANNEL = "3337913";

// Server-side rate-limit tracker (in-memory, per-process — good enough for single instance)
let lastThingSpeakUpdate = 0;
const MIN_UPDATE_INTERVAL_MS = 16000; // 16s to comfortably clear ThingSpeak's 15s free-tier limit

const controlMotor = async (req, res, next) => {
  try {
    const { status, mode = 'manual', duration } = req.body;

    if (!['ON', 'OFF'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ON or OFF' });
    }

    // 1. Server-side rate limit guard — prevent hitting ThingSpeak before 16s have passed
    const elapsed = Date.now() - lastThingSpeakUpdate;
    if (elapsed < MIN_UPDATE_INTERVAL_MS) {
      const waitSec = Math.ceil((MIN_UPDATE_INTERVAL_MS - elapsed) / 1000);
      console.log(`[MOTOR] Rate limit guard: ${waitSec}s remaining, waiting...`);
      // Wait out the remainder instead of failing — this makes single taps always work
      await new Promise(resolve => setTimeout(resolve, MIN_UPDATE_INTERVAL_MS - elapsed));
    }

    // 2. Use user's stored API key or fall back to project key
    const user = await User.findById(req.user._id).select('thingSpeakApiKey');
    const writeKey = user?.thingSpeakApiKey || THINGSPEAK_WRITE_KEY;

    // 3. Build and send ThingSpeak update
    // field6 = Motor (1=ON, 0=OFF)  |  field7 = Mode (1=AUTO, 0=MANUAL)
    const field6 = status === 'ON' ? '1' : '0';
    const field7 = mode === 'auto' ? '1' : '0';

    const url = `https://api.thingspeak.com/update?api_key=${writeKey}&field6=${field6}&field7=${field7}`;
    console.log(`[MOTOR] → ThingSpeak: motor=${status} mode=${mode} field6=${field6} field7=${field7}`);

    const tsRes = await axios.get(url);
    const entryId = Number(tsRes.data);
    console.log(`[MOTOR] ← ThingSpeak entry ID: ${entryId}`);

    // ThingSpeak returns 0 when the update is rate-limited / rejected
    if (entryId === 0) {
      console.warn('[MOTOR] ThingSpeak rejected update (rate limit). Motor state NOT changed.');
      return res.status(429).json({
        success: false,
        message: 'ThingSpeak is rate-limited. Please wait a few seconds and try again.',
      });
    }

    // 4. Success — stamp the time and save to MongoDB
    lastThingSpeakUpdate = Date.now();
    const log = await MotorLog.create({ userId: req.user._id, status, mode, duration: duration || null });

    // 5. Motor Timer Handling
    // If motor is turning OFF, or switching to AUTO, cancel any active timer
    if (status === 'OFF' || mode === 'auto') {
      await MotorTimer.updateMany({ userId: req.user._id, active: true }, { active: false });
    }
    // If motor is turning ON with a valid duration, create a new active timer
    else if (status === 'ON' && mode === 'manual' && duration) {
      // Cancel previous timers first securely
      await MotorTimer.updateMany({ userId: req.user._id, active: true }, { active: false });

      const turnOffAt = new Date(Date.now() + duration * 60000);
      await MotorTimer.create({
        userId: req.user._id,
        turnOffAt,
        active: true
      });
      console.log(`[MOTOR] Timer set for ${duration} minutes. Motor will turn OFF at ${turnOffAt.toISOString()}`);
    }

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error('[MOTOR] Error:', error.message);
    next(error);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const logs = await MotorLog.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const READ_API_KEY = "TNRHJH2DGPWOACJD";
    // Fetch 60 rows — frequent motor-command toggles (without sensor data)
    // push the last sensor reading far down the feed.
    const url = `https://api.thingspeak.com/channels/3337913/feeds.json?results=60&api_key=${READ_API_KEY}`;

    const response = await axios.get(url);
    const feeds = response.data.feeds;

    if (!feeds || feeds.length === 0) {
      return res.status(404).json({ success: false, message: "No data on ThingSpeak channel." });
    }

    // Find the most recent feed that has SENSOR data (field1 or field2 not null)
    let sensorFeed = null;
    // Find the most recent feed that has MOTOR state (field6 or field7 not null)
    let motorFeed = null;

    for (let i = feeds.length - 1; i >= 0; i--) {
      const f = feeds[i];
      if (!sensorFeed && (f.field1 != null || f.field2 != null)) sensorFeed = f;
      if (!motorFeed && (f.field6 != null || f.field7 != null)) motorFeed = f;
      if (sensorFeed && motorFeed) break; // both found — stop scanning
    }

    if (!sensorFeed) {
      return res.status(404).json({ success: false, message: "No live sensor data found on ThingSpeak." });
    }

    // ESP32 field map: field1=moisture, field2=temp, field3=hum, field4=soilTemp, field5=ldr,
    // field6=motor, field7=mode, field8=encodedNPK (N*10000+P*100+K)
    const rawMoisture = parseFloat(sensorFeed.field1);
    const moisturePct = isNaN(rawMoisture) ? 0 : Math.max(0, Math.min(100, Math.round(((4095 - rawMoisture) / 4095) * 100)));
    const rawLdr = parseFloat(sensorFeed.field5);
    const ldrPct = isNaN(rawLdr) ? 0 : Math.max(0, Math.min(100, Math.round((rawLdr / 4095) * 100)));

    // Decode packed NPK from field8
    let nitrogen = null, phosphorus = null, potassium = null;
    const encodedNPK = sensorFeed.field8 != null ? parseInt(sensorFeed.field8, 10) : null;
    if (encodedNPK != null && !isNaN(encodedNPK)) {
      nitrogen   = Math.floor(encodedNPK / 10000);
      phosphorus = Math.floor(encodedNPK / 100) % 100;
      potassium  = encodedNPK % 100;
    }

    // Use motorFeed for field6/field7 (may be more recent than sensorFeed)
    const mf = motorFeed || sensorFeed;

    // Fetch active timer for this user if exists
    const activeTimer = await MotorTimer.findOne({ userId: req.user._id, active: true });

    res.json({
      success: true,
      data: {
        soil: moisturePct,
        temp: sensorFeed.field2,
        humidity: sensorFeed.field3,
        soilTemp: sensorFeed.field4,
        light: ldrPct,
        motor: mf.field6,
        mode: mf.field7,
        nitrogen,
        phosphorus,
        potassium,
        timestamp: sensorFeed.created_at,
        activeTimer: activeTimer ? { turnOffAt: activeTimer.turnOffAt } : null
      }
    });
  } catch (error) {
    console.error("Failed to fetch live motor status:", error.message);
    next(error);
  }
};

module.exports = { controlMotor, getLogs, getStatus };
