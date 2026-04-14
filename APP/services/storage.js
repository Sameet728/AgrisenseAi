// ============================================================
// services/storage.js — AsyncStorage helpers
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants";

export const saveUser = async (user) => {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

export const saveToken = async (token) => {
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getToken = async () => {
  return AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const saveApiKey = async (key) => {
  await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, key);
};

export const getApiKey = async () => {
  return AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
};

export const saveMotorMode = async (mode) => {
  await AsyncStorage.setItem(STORAGE_KEYS.MOTOR_MODE, mode);
};

export const getMotorMode = async () => {
  return AsyncStorage.getItem(STORAGE_KEYS.MOTOR_MODE);
};

export const saveMotorStatus = async (status) => {
  await AsyncStorage.setItem(STORAGE_KEYS.MOTOR_STATUS, status);
};

export const getMotorStatus = async () => {
  return AsyncStorage.getItem(STORAGE_KEYS.MOTOR_STATUS);
};

export const saveProfileData = async (data) => {
  await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_DATA, JSON.stringify(data));
};

export const getProfileData = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_DATA);
  return raw ? JSON.parse(raw) : null;
};

export const clearAll = async () => {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
};
