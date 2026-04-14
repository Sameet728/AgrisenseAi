// ============================================================
// data/seed.js — AgriSense AI Mock Data
// ============================================================

export const SEED_SENSOR_DATA = {
  id: "sensor_001",
  farmId: "farm_001",
  timestamp: new Date().toISOString(),
  moisture: 45,         // % — optimal: 60–80
  temperature: 30,      // °C — optimal: 20–28
  humidity: 70,         // % — optimal: 40–60
  soilTemp: 28,         // °C — optimal: 18–25
  ldr: 300,             // lux — optimal: 400–800
  motor: "ON",          // ON | OFF
  ph: 6.2,              // pH — optimal: 6.0–7.0
  nitrogen: 38,         // mg/kg
  phosphorus: 22,       // mg/kg
  potassium: 180,       // mg/kg
};

export const SEED_SENSOR_HISTORY = [
  { time: "06:00", moisture: 55, temperature: 22, humidity: 65, ldr: 120 },
  { time: "08:00", moisture: 52, temperature: 24, humidity: 63, ldr: 350 },
  { time: "10:00", moisture: 48, temperature: 27, humidity: 68, ldr: 580 },
  { time: "12:00", moisture: 45, temperature: 30, humidity: 70, ldr: 720 },
  { time: "14:00", moisture: 42, temperature: 32, humidity: 72, ldr: 680 },
  { time: "16:00", moisture: 40, temperature: 31, humidity: 71, ldr: 450 },
  { time: "18:00", moisture: 44, temperature: 28, humidity: 69, ldr: 200 },
  { time: "20:00", moisture: 47, temperature: 25, humidity: 67, ldr: 40  },
];

export const SEED_USER = {
  id: "user_001",
  name: "Rajesh Patil",
  email: "rajesh.patil@farm.com",
  phone: "+91 98765 43210",
  farm: "Patil Agro Farm",
  location: "Pune, Maharashtra",
  thingSpeakApiKey: "ABCD1234EFGH5678",
  channelId: "2345678",
  avatar: null,
  joinedDate: "2024-01-15",
};

export const SEED_INSIGHTS = [
  {
    id: "ins_001",
    type: "warning",
    icon: "water",
    title: "Irrigation Required",
    message:
      "Soil moisture is at 45%, which is below the optimal range of 60–80%. Consider irrigating within the next 2 hours to avoid crop stress.",
    action: "Turn On Motor",
    timestamp: new Date().toISOString(),
    severity: "high",
  },
  {
    id: "ins_002",
    type: "danger",
    icon: "thermometer",
    title: "High Temperature Alert",
    message:
      "Current temperature of 30°C exceeds the optimal range. Heat stress may affect crop yield. Ensure adequate shade or irrigation.",
    action: "View Details",
    timestamp: new Date().toISOString(),
    severity: "high",
  },
  {
    id: "ins_003",
    type: "warning",
    icon: "cloud",
    title: "Fungal Disease Risk",
    message:
      "High humidity of 70% combined with elevated temperature creates favorable conditions for fungal diseases. Monitor crops closely.",
    action: "Learn More",
    timestamp: new Date().toISOString(),
    severity: "medium",
  },
  {
    id: "ins_004",
    type: "info",
    icon: "sunny",
    title: "Low Sunlight Detected",
    message:
      "LDR reading of 300 lux is below optimal (400–800 lux). Plant growth may be slower today. Natural improvement expected by afternoon.",
    action: null,
    timestamp: new Date().toISOString(),
    severity: "low",
  },
  {
    id: "ins_005",
    type: "success",
    icon: "leaf",
    title: "Soil pH Optimal",
    message:
      "Soil pH of 6.2 is within the ideal range of 6.0–7.0. Your crops are in good conditions for nutrient absorption.",
    action: null,
    timestamp: new Date().toISOString(),
    severity: "low",
  },
  {
    id: "ins_006",
    type: "info",
    icon: "analytics",
    title: "Soil Temperature Elevated",
    message:
      "Soil temperature at 28°C is slightly above optimal (18–25°C). This may accelerate nutrient decomposition. No immediate action needed.",
    action: null,
    timestamp: new Date().toISOString(),
    severity: "medium",
  },
];

export const SEED_MOTOR_LOG = [
  { id: "log_001", action: "ON",  mode: "Manual", timestamp: "2024-06-01T06:30:00Z", duration: 45 },
  { id: "log_002", action: "OFF", mode: "Manual", timestamp: "2024-06-01T07:15:00Z", duration: null },
  { id: "log_003", action: "ON",  mode: "Auto",   timestamp: "2024-06-01T12:00:00Z", duration: 30 },
  { id: "log_004", action: "OFF", mode: "Auto",   timestamp: "2024-06-01T12:30:00Z", duration: null },
  { id: "log_005", action: "ON",  mode: "Manual", timestamp: "2024-06-01T18:00:00Z", duration: 20 },
];

export const SEED_CREDENTIALS = {
  email: "rajesh.patil@farm.com",
  password: "farm@1234",
};

export const SENSOR_THRESHOLDS = {
  moisture:    { min: 60,  max: 80,  unit: "%",   label: "Soil Moisture"   },
  temperature: { min: 20,  max: 28,  unit: "°C",  label: "Temperature"     },
  humidity:    { min: 40,  max: 60,  unit: "%",   label: "Humidity"        },
  soilTemp:    { min: 18,  max: 25,  unit: "°C",  label: "Soil Temp"       },
  ldr:         { min: 400, max: 800, unit: " lux",label: "Light (LDR)"     },
  ph:          { min: 6.0, max: 7.0, unit: " pH", label: "Soil pH"         },
};
