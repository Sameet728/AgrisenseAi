export * from './sensorHelpers';

export const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password) => password.length >= 6;

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

export const truncate = (str, n = 30) =>
  str && str.length > n ? str.slice(0, n) + "…" : str;
