import axios from "axios";
import { getProfileData } from "./storage";

const THINGSPEAK_CHANNEL_ID = "3337913";
const THINGSPEAK_BASE_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json`;

/**
 * Normalizes a raw ThingSpeak feed object.
 * Converts ESP32 analog values (0-4095) to workable percentages.
 */
const mapFeedToSensorData = (feed) => {
  if (!feed) return null;

  // Validate critical fields before accepting the feed layout.
  // We use == null which catches both null and undefined.
  // Only reject if BOTH field1 AND field2 are null — a mix of sensor + motor rows means
  // sometimes only one channel writes at a time (motor commands create rows with no sensor data).
  if (feed.field1 == null && feed.field2 == null) return null;

  // Convert Analog Soil Moisture to Percentage
  // ESP32 analog: 4095 = Completely Dry (0%), 0 = Saturated (100%)
  const rawMoisture = parseFloat(feed.field1);
  const moisturePct = isNaN(rawMoisture)
    ? 0
    : Math.max(0, Math.min(100, Math.round(((4095 - rawMoisture) / 4095) * 100)));

  // ESP32 Field Mapping:
  //   field1 → Soil Moisture (raw ADC 0-4095)
  //   field2 → Temperature   (DHT11 °C)
  //   field3 → Humidity      (DHT11 %)
  //   field4 → Soil Temp     (Dallas DS18B20 °C)
  //   field5 → LDR           (raw ADC 0-4095)
  //   field6 → Motor Status  (1=ON, 0=OFF)
  //   field7 → Mode          (1=AUTO, 0=MANUAL)
  //   field8 → Encoded NPK   (N*10000 + P*100 + K) — decoded below
  const rawLdr = parseFloat(feed.field5);
  const ldrPct = isNaN(rawLdr)
    ? 0
    : Math.max(0, Math.min(100, Math.round((rawLdr / 4095) * 100)));

  // Decode packed NPK integer: encodedNPK = N*10000 + P*100 + K
  let nitrogen = null, phosphorus = null, potassium = null;
  const encodedNPK = feed.field8 != null ? parseInt(feed.field8, 10) : null;
  if (encodedNPK != null && !isNaN(encodedNPK)) {
    nitrogen   = Math.floor(encodedNPK / 10000);
    phosphorus = Math.floor(encodedNPK / 100) % 100;
    potassium  = encodedNPK % 100;
  }

  return {
    moisture:    moisturePct,
    temperature: parseFloat(feed.field2) || 0,
    humidity:    parseFloat(feed.field3) || 0,
    soilTemp:    parseFloat(feed.field4) || 0,
    ldr:         ldrPct,
    motor:       feed.field6 === "1" ? "ON" : "OFF",
    mode:        feed.field7 === "1" ? "auto" : "manual",
    nitrogen:    isNaN(nitrogen)   ? null : nitrogen,
    phosphorus:  isNaN(phosphorus) ? null : phosphorus,
    potassium:   isNaN(potassium)  ? null : potassium,
    timestamp:   feed.created_at || new Date().toISOString(),
    time: new Date(feed.created_at || Date.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

/**
 * Fetch current telemetry. We grab results=5 to bypass recent `null` or offline entries
 * and systematically select the most recent valid packet.
 */
export const fetchThingSpeakCurrent = async () => {
  const profile = await getProfileData();
  const apiKey = profile?.thingSpeakApiKey || "";
  
  // Fetch 60 results — frequent motor-command toggles (which create rows with no sensor data) 
  // can push the last real sensor reading far down the feed.
  const url = `${THINGSPEAK_BASE_URL}?results=60${
    apiKey ? `&api_key=${apiKey}` : ""
  }`;

  const response = await axios.get(url, { timeout: 8000 });
  const feeds = response.data?.feeds;

  if (!feeds || feeds.length === 0) {
    throw new Error("No data found from ThingSpeak.");
  }

  // Iterate backwards from the most recent to find the first NON-NULL valid feed
  for (let i = feeds.length - 1; i >= 0; i--) {
    const mapped = mapFeedToSensorData(feeds[i]);
    if (mapped !== null) {
      return mapped;
    }
  }

  throw new Error("Only null or invalid feeds located in the current stack.");
};

/**
 * Fetch historical data points. 
 */
export const fetchThingSpeakHistory = async (limit = 10) => {
  const profile = await getProfileData();
  const apiKey = profile?.thingSpeakApiKey || "";
  
  const url = `${THINGSPEAK_BASE_URL}?results=${limit}${
    apiKey ? `&api_key=${apiKey}` : ""
  }`;

  const response = await axios.get(url, { timeout: 10000 });
  const feeds = response.data?.feeds;

  if (!feeds) {
    return [];
  }

  // Filter out any ghost/null payloads returning only clean usable data
  return feeds.map(mapFeedToSensorData).filter((data) => data !== null);
};
