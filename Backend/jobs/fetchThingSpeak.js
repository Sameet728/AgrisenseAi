const axios = require('axios');
const cron = require('node-cron');
const User = require('../models/User');
const SensorHistory = require('../models/SensorHistory');
const MotorTimer = require('../models/MotorTimer');
const MotorLog = require('../models/MotorLog');

const THINGSPEAK_DEFAULT_CHANNEL = "3337913";
const THINGSPEAK_WRITE_KEY = "5YD6MK03CUBJEHDI"; // Fallback write key

/**
 * Normalizes a raw ThingSpeak feed object.
 * Replicates the exact conversion logic used in the mobile app.
 */
const mapFeedToSensorData = (feed) => {
  if (!feed || (feed.field1 == null && feed.field2 == null)) return null;

  const rawMoisture = parseFloat(feed.field1);
  const moisturePct = isNaN(rawMoisture)
    ? 0
    : Math.max(0, Math.min(100, Math.round(((4095 - rawMoisture) / 4095) * 100)));

  const rawLdr = parseFloat(feed.field5);
  const ldrPct = isNaN(rawLdr)
    ? 0
    : Math.max(0, Math.min(100, Math.round((rawLdr / 4095) * 100)));

  return {
    soil: moisturePct,
    temperature: parseFloat(feed.field2) || 0,
    humidity: parseFloat(feed.field3) || 0,
    soilTemp: parseFloat(feed.field4) || 0,
    light: ldrPct,
    motor: feed.field6 === "1" ? "ON" : "OFF",
    mode: feed.field7 === "1" ? "auto" : "manual",
    timestamp: feed.created_at ? new Date(feed.created_at) : new Date()
  };
};

/**
 * Job orchestrator that pulls data exactly from ThingSpeak
 * and records it natively onto the user profiles in MongoDB.
 */
const pollThingSpeak = async () => {
  console.log('[CRON] Starting hourly ThingSpeak sync...');
  try {
    const users = await User.find({});

    const apiKeyMap = {};
    for (const user of users) {
      const key = user.thingSpeakApiKey || 'default';
      if (!apiKeyMap[key]) apiKeyMap[key] = [];
      apiKeyMap[key].push(user._id);
    }

    for (const [key, userIds] of Object.entries(apiKeyMap)) {
      try {
        const actualKey = key === 'default' ? 'TNRHJH2DGPWOACJD' : key;
        const url = `https://api.thingspeak.com/channels/${THINGSPEAK_DEFAULT_CHANNEL}/feeds.json?results=60&api_key=${actualKey}`;
        const response = await axios.get(url, { timeout: 10000 });
        const feeds = response.data?.feeds || [];

        let latestValid = null;
        for (let i = feeds.length - 1; i >= 0; i--) {
          const mapped = mapFeedToSensorData(feeds[i]);
          if (mapped) {
            latestValid = mapped;
            break;
          }
        }

        if (latestValid) {
          const docs = userIds.map(uid => ({
            userId: uid,
            ...latestValid
          }));
          await SensorHistory.insertMany(docs);
          console.log(`[CRON] Successfully recorded reading for ${docs.length} users (subset: ${key}). T: ${latestValid.temperature}°C, M: ${latestValid.soil}%`);
        } else {
          console.log(`[CRON] No valid sensor data found for subset ${key}.`);
        }
      } catch (err) {
        console.error(`[CRON] Failed to fetch for key subset ${key}:`, err.message);
      }
    }
  } catch (err) {
    console.error(`[CRON] Critical failure:`, err.message);
  }
};

/**
 * Job orchestrator for automatic motor shutdown functionality.
 * Runs every minute to see if any user's motor timer has expired.
 */
/**
 * Sends an OFF command to ThingSpeak with up to maxRetries automatic retries,
 * waiting 16 seconds between each attempt (ThingSpeak free-tier rate limit).
 */
const sendThingSpeakOff = async (writeKey, maxRetries = 5) => {
  const url = `https://api.thingspeak.com/update?api_key=${writeKey}&field6=0&field7=0`;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const tsRes = await axios.get(url);
    const entryId = Number(tsRes.data);
    if (entryId !== 0) return true; // Success
    console.warn(`[CRON] ThingSpeak rate-limited (attempt ${attempt}/${maxRetries}). Waiting 16s before retry...`);
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 16000));
    }
  }
  return false; // All retries exhausted
};

/**
 * Job orchestrator for automatic motor shutdown functionality.
 * Runs every 15 seconds to see if any user's motor timer has expired.
 * Uses inline retry so a rate-limit never forces a full extra minute of waiting.
 */
const pollMotorTimers = async () => {
  try {
    const now = new Date();
    const expiredTimers = await MotorTimer.find({
      active: true,
      turnOffAt: { $lte: now }
    }).populate('userId', 'thingSpeakApiKey');

    if (expiredTimers.length > 0) {
      console.log(`[CRON] Found ${expiredTimers.length} expired motor timers to process.`);
    }

    for (const timer of expiredTimers) {
      try {
        const user = timer.userId;
        const writeKey = user?.thingSpeakApiKey || THINGSPEAK_WRITE_KEY;

        console.log(`[CRON] Triggering auto-OFF for user ${user._id} via ThingSpeak...`);
        const success = await sendThingSpeakOff(writeKey);

        if (success) {
          timer.active = false;
          await timer.save();
          await MotorLog.create({ userId: user._id, status: 'OFF', mode: 'manual', duration: null });
          console.log(`[CRON] Successfully processed OFF timer for user ${user._id}.`);
        } else {
          console.error(`[CRON] All retries exhausted for user ${user._id}. Timer will NOT be cancelled — will retry on next 15s poll.`);
        }
      } catch (err) {
        console.error(`[CRON] Failed to process timer for user ${timer.userId}:`, err.message);
      }
    }
  } catch (error) {
    console.error(`[CRON] Error checking motor timers:`, error.message);
  }
};

const initCronJobs = () => {
  cron.schedule('0 * * * *', pollThingSpeak);
  console.log('[CRON] Scheduled ThingSpeak historical sync (Hourly => 0 * * * *).');

  // Run every 15 seconds — gives fast response on timer expiry and quick rate-limit recovery
  cron.schedule('*/15 * * * * *', pollMotorTimers);
  console.log('[CRON] Scheduled Motor Timer poll (Every 15s => */15 * * * * *).');
};

module.exports = { initCronJobs, pollThingSpeak, pollMotorTimers };
