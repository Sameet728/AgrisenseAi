// ============================================================
// services/authEvents.js
// Simple event emitter to let apiClient signal AuthContext
// to force-logout without a circular import.
// ============================================================

const listeners = new Set();

export const onForceLogout = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn); // returns unsubscribe
};

export const emitForceLogout = () => {
  listeners.forEach(fn => {
    try { fn(); } catch (_) {}
  });
};
