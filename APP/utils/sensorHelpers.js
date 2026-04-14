// ============================================================
// utils/sensorHelpers.js
// Thresholds match ESP32 LCD updateLCD() logic exactly
// ============================================================

import { COLORS } from "../constants/theme";

/**
 * Thresholds derived directly from ESP32 firmware:
 *
 *  Soil Moisture %  : DRY  < 30   | NORMAL 30–70  | WET  > 70
 *  Temperature °C   : LOW  < 18   | NORMAL 18–35  | HIGH > 35
 *  Humidity %       : LOW  < 40   | NORMAL 40–70  | HIGH > 70
 *  Light (ldr) %    : LOW  < 30   | NORMAL 30–70  | HIGH > 70
 *  Soil Temp °C     : LOW  < 18   | NORMAL 18–32  | HIGH > 32
 *
 *  Status mapping:
 *    NORMAL  → "optimal"
 *    LOW/WET → "warning"   (moisture WET is warning, not critical)
 *    DRY     → "critical"  (moisture < 30 is critical)
 *    HIGH temp/soilTemp → "critical"
 *    LOW temp → "warning"
 */
const THRESHOLDS = {
  moisture:    { optMin: 30,  optMax: 70  },  // DRY=critical, WET=warning
  temperature: { optMin: 18,  optMax: 35  },  // LOW=warning,  HIGH=critical
  humidity:    { optMin: 40,  optMax: 70  },  // LOW=warning,  HIGH=warning
  soilTemp:    { optMin: 18,  optMax: 32  },  // LOW=warning,  HIGH=critical
  ldr:         { optMin: 30,  optMax: 70  },  // LOW=warning,  HIGH=warning
};

// Keys that become critical when value is BELOW optMin
const CRITICAL_BELOW = new Set(["moisture"]);
// Keys that become critical when value is ABOVE optMax
const CRITICAL_ABOVE = new Set(["temperature", "soilTemp"]);

/**
 * Returns "optimal" | "warning" | "critical"
 * Matches exactly the same thresholds used on the ESP32 LCD.
 */
export const getSensorStatus = (key, value) => {
  const t = THRESHOLDS[key];
  if (!t || value === null || value === undefined) return "optimal";

  if (value >= t.optMin && value <= t.optMax) return "optimal";

  if (value < t.optMin) {
    return CRITICAL_BELOW.has(key) ? "critical" : "warning";
  }
  // value > optMax
  return CRITICAL_ABOVE.has(key) ? "critical" : "warning";
};

/**
 * Returns the color for a given status.
 */
export const getStatusColor = (status) => {
  switch (status) {
    case "optimal":  return COLORS.success;
    case "warning":  return COLORS.warning;
    case "critical": return COLORS.danger;
    default:         return COLORS.textSecondary;
  }
};

export const getStatusBg = (status) => {
  switch (status) {
    case "optimal":  return COLORS.successBg;
    case "warning":  return COLORS.warningBg;
    case "critical": return COLORS.dangerBg;
    default:         return COLORS.surfaceAlt;
  }
};

/**
 * Localized status label: Optimal / Warning / Critical
 * Pass appLanguage ('en' | 'mr') from context.
 */
export const getStatusLabel = (status, lang = "en") => {
  if (lang === "mr") {
    switch (status) {
      case "optimal":  return "उत्तम";
      case "warning":  return "सावधान";
      case "critical": return "धोका";
      default:         return "—";
    }
  }
  switch (status) {
    case "optimal":  return "Optimal";
    case "warning":  return "Warning";
    case "critical": return "Critical";
    default:         return "—";
  }
};

export const getSensorLabel = (key) => {
  const labels = {
    moisture:    "Soil Moisture",
    temperature: "Temperature",
    humidity:    "Humidity",
    soilTemp:    "Soil Temp",
    ldr:         "Light (LDR)",
    ph:          "Soil pH",
    nitrogen:    "Nitrogen",
    phosphorus:  "Phosphorus",
    potassium:   "Potassium",
  };
  return labels[key] || key;
};

export const getSensorUnit = (key) => {
  const units = {
    moisture:    "%",
    temperature: "°C",
    humidity:    "%",
    soilTemp:    "°C",
    ldr:         " lux",
    ph:          " pH",
    nitrogen:    " mg/kg",
    phosphorus:  " mg/kg",
    potassium:   " mg/kg",
  };
  return units[key] || "";
};

export const getSensorIcon = (key) => {
  const icons = {
    moisture:    "water",
    temperature: "thermometer",
    humidity:    "cloud",
    soilTemp:    "earth",
    ldr:         "sunny",
    ph:          "flask",
    nitrogen:    "leaf",
    phosphorus:  "nutrition",
    potassium:   "fitness",
  };
  return icons[key] || "analytics";
};

export const formatTimestamp = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
