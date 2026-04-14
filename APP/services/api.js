// ============================================================
// services/api.js — Real API Integration with ThingSpeak Fallbacks
// ============================================================

import apiClient from "./apiClient";
import { fetchThingSpeakCurrent, fetchThingSpeakHistory } from "./thingspeakService";
import { getProfileData } from "./storage";

// ── Auth APIs ────────────────────────────────────────────────

export const apiLogin = async (email, password) => {
  const response = await apiClient.post("/auth/login", { email, password });
  return {
    success: true,
    token: response.data.token,
    user: response.data,
  };
};

export const apiSignup = async (name, email, password, apiKey) => {
  const payload = { name, email, password };
  if (apiKey) payload.thingSpeakApiKey = apiKey;

  const response = await apiClient.post("/auth/signup", payload);
  return {
    success: true,
    token: response.data.token,
    user: response.data,
  };
};

// ── Sensor Data API (ThingSpeak primary with Backend Failover)

export const apiGetSensorData = async () => {
  try {
    const profile = await getProfileData();

    // No API key → skip ThingSpeak silently, go straight to backend cache
    if (!profile || !profile.thingSpeakApiKey) {
      const response = await apiClient.get("/sensor/current");
      return { success: true, data: response.data };
    }

    const data = await fetchThingSpeakCurrent();
    return { success: true, data };
  } catch (error) {
    // Only log genuine network/server errors, not missing-key skips
    if (!error.message?.includes('API key')) {
      console.warn("[ThingSpeak] Live fetch failed, using cache:", error.message);
    }
    const response = await apiClient.get("/sensor/current");
    return { success: true, data: response.data };
  }
};

export const apiGetSensorHistory = async () => {
  try {
    const profile = await getProfileData();

    // No API key → skip ThingSpeak silently, go straight to backend cache
    if (!profile || !profile.thingSpeakApiKey) {
      const response = await apiClient.get("/sensor/history?limit=50");
      return { success: true, data: response.data };
    }

    const data = await fetchThingSpeakHistory(10);
    return { success: true, data };
  } catch (error) {
    if (!error.message?.includes('API key')) {
      console.warn("[ThingSpeak] History fetch failed, using cache:", error.message);
    }
    const response = await apiClient.get("/sensor/history?limit=50");
    return { success: true, data: response.data };
  }
};

// ── Insights API ─────────────────────────────────────────────

export const apiGetFarmDataHistory = async (range = "all", customStart = null, customEnd = null) => {
  let url = `/data/history?range=${range}`;
  if (customStart) url += `&startDate=${customStart}`;
  if (customEnd) url += `&endDate=${customEnd}`;
  
  const response = await apiClient.get(url);
  // apiClient interceptor already unwraps into { success, count, data }
  return response;
};

export const apiGetInsights = async () => {
  let mappedInsights = [];
  
  try {
    const liveSensorResponse = await apiGetSensorData();
    const liveData = liveSensorResponse.data;
    const profile = await getProfileData();
    
    const isProfileComplete = profile?.isProfileComplete;
    const crop = profile?.cropType || "your crops";
    const soil = profile?.soilType || "your soil";

    // Insight 1: Moisture Evaluation
    if (liveData.moisture < 40) {
      mappedInsights.push({
        id: "insight_moisture",
        type: "warning",
        priority: "high",
        message: isProfileComplete
          ? `Soil moisture critically low (${liveData.moisture}%). Since you are growing ${crop} in ${soil} soil, immediate irrigation is strongly recommended to prevent yield loss.`
          : `Soil moisture critically low (${liveData.moisture}%). Irrigation required.`,
        action: "Check Motor",
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      });
    } else {
      mappedInsights.push({
        id: "insight_moisture_ok",
        type: "info",
        priority: "low",
        message: isProfileComplete
          ? `${crop} moisture levels are perfectly stable at ${liveData.moisture}% for ${soil} soil.`
          : `Soil moisture stable at ${liveData.moisture}%.`,
        action: "Review Soil Status",
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      });
    }
    
    // Insight 2: Temperature Alert
    if (liveData.temperature > 35) {
      mappedInsights.push({
        id: "insight_temp",
        type: "critical",
        priority: "high",
        message: isProfileComplete
          ? `High temperature alert (${liveData.temperature}°C) detected! ${crop} has a severe heat evaporation risk under these conditions.`
          : `High temperature alert (${liveData.temperature}°C) detected! Evaporation risk.`,
        action: "Review Environment",
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      });
    }

    // Insight 3: Humidity Checks
    if (liveData.humidity > 85) {
        mappedInsights.push({
            id: "insight_humidity",
            type: "warning",
            priority: "medium",
            message: isProfileComplete
              ? `High humidity (${liveData.humidity}%). Monitor closely for potential fungal growth affecting your ${crop}.`
              : `High humidity (${liveData.humidity}%). Monitor for potential fungal growth.`,
            action: "Review Environment",
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          });
    }
    
    return {
      success: true,
      data: mappedInsights,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error.message.includes("ThingSpeak API key")) {
      // Build a fallback insight explicitly telling the user to onboard!
      return {
        success: true,
        data: [{
            id: "action_key_required",
            type: "warning",
            priority: "high",
            message: error.message,
            action: "Configure API",
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        }],
        generatedAt: new Date().toISOString(),
      };
    }

    // Fallback from Backend
    const response = await apiClient.get("/insights");
    const rawData = response.data || {};
    
    mappedInsights = [
      {
        id: "1",
        type: "info",
        priority: "medium",
        message: rawData.soilMoistureStatus || "Analyzing soil moisture trends...",
        timestamp: rawData.generatedAt ? new Date(rawData.generatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Just now",
      },
      {
        id: "2",
        type: "warning",
        priority: "high",
        message: rawData.irrigationRecommendation || "Evaluate current irrigation schedule thresholds.",
        timestamp: rawData.generatedAt ? new Date(rawData.generatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Just now",
      },
    ];

    return {
        success: true,
        data: mappedInsights,
        generatedAt: rawData.generatedAt || new Date().toISOString(),
    };
  }
};

// ── Crop & ML Insights API ──────────────────────────────────────

export const apiGetCropRecommendation = async () => {
    // Collect local profile explicitly for DB aggregation
    const profile = await getProfileData();
    const response = await apiClient.post("/insights/crop", { profileData: profile });
    return response; 
};

export const apiRegenerateCropRecommendation = async () => {
    const profile = await getProfileData();
    const response = await apiClient.post("/insights/crop/regenerate", { profileData: profile });
    return response;
};

// ── Fertilizer ML Insights API ────────────────────────────────
export const apiGetFertilizerRecommendation = async () => {
    const profile = await getProfileData();
    const response = await apiClient.post("/insights/fertilizer", { profileData: profile });
    return response;
};

export const apiRegenerateFertilizerRecommendation = async () => {
    const profile = await getProfileData();
    const response = await apiClient.post("/insights/fertilizer/regenerate", { profileData: profile });
    return response;
};

// ── Irrigation Prediction API ──────────────────────────────────
export const apiGetIrrigationRecommendation = async () => {
    const profile = await getProfileData();
    const response = await apiClient.post("/insights/irrigation", { profileData: profile });
    return response;
};

export const apiRegenerateIrrigationRecommendation = async () => {
    const profile = await getProfileData();
    const response = await apiClient.post("/insights/irrigation/regenerate", { profileData: profile });
    return response;
};

// ── Motor API ─────────────────────────────────────────────────

export const apiSetMotorStatus = async (status, mode = "manual", duration = null) => {
  // apiClient interceptor: response = backend body = { success: true, data: MotorLog }
  const response = await apiClient.post("/motor/control", { status, mode, duration });
  const log = response.data || {};
  return {
    success: true,
    motor: log.status || status,
    mode:  log.mode  || mode,
    timestamp: log.timestamp,
    message: `Motor turned ${status} in ${mode} mode.`,
  };
};

export const apiGetMotorLog = async () => {
  const response = await apiClient.get("/motor/logs");
  return {
    success: true,
    data: response.data,
  };
};

export const apiGetMotorStatus = async () => {
  // Backend returns: { success: true, data: { soil, temp, humidity, soilTemp, light, motor, mode, timestamp } }
  // apiClient interceptor unwraps one level → response IS the raw backend JSON
  const response = await apiClient.get("/motor/status");
  return response; // response = { success: true, data: {...} }
};

// ── Profile API ───────────────────────────────────────────────

export const apiGetProfile = async () => {
  const response = await apiClient.get("/profile");
  return {
    success: true,
    user: response.data,
  };
};

export const apiUpdateProfile = async (updates) => {
  const response = await apiClient.put("/profile/update", updates);
  return {
    success: true,
    user: response.data,
  };
};

export const apiUpdateApiKey = async (apiKey) => {
  const response = await apiClient.put("/profile/api-key", { thingSpeakApiKey: apiKey });
  return {
    success: true,
    message: response.message || "ThingSpeak API key updated successfully.",
    apiKey,
  };
};
