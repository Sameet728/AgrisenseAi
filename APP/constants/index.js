// ============================================================
// constants/index.js
// ============================================================

export * from './theme';

export const APP_NAME = "AgriSense AI";
export const APP_VERSION = "1.0.0";

export const STORAGE_KEYS = {
  USER:           "@agrisense_user",
  AUTH_TOKEN:     "@agrisense_token",
  API_KEY:        "@agrisense_api_key",
  MOTOR_MODE:     "@agrisense_motor_mode",
  MOTOR_STATUS:   "@agrisense_motor_status",
  ONBOARDED:      "@agrisense_onboarded",
  PROFILE_DATA:   "@agrisense_profile_data",
};

export const SENSOR_STATUS = {
  OPTIMAL:  "optimal",
  WARNING:  "warning",
  CRITICAL: "critical",
};

export const MOTOR_MODES = {
  AUTO:   "auto",
  MANUAL: "manual",
};
