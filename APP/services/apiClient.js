// ============================================================
// services/apiClient.js — Axios Configuration and Interceptors
// ============================================================

import axios from 'axios';
import { getToken, clearAll } from './storage';
import { emitForceLogout } from './authEvents';

// TODO: Replace YOUR_LOCAL_IP with your machine's actual local IPv4
// Example: export const BASE_URL = 'http://192.168.1.150:5000/api';
const BASE_URL = "http://192.168.1.34:5000/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: Attach JWT Token ──
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Normalize & Handle Auth Errors ──
apiClient.interceptors.response.use(
  (response) => {
    // Automatically unpack backend { success: true, data: ... }
    return response.data;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      // 1. Clear stored credentials
      await clearAll();
      // 2. Signal AuthContext to wipe state + navigate to Login
      //    (no Alert — AuthContext will show the login screen automatically)
      emitForceLogout();
    }

    // Instead of completely replacing the error object with a generic Error, 
    // we preserve the Axios error object (including .response.status) so components can read it.
    if (error.response?.data?.message) {
        error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
