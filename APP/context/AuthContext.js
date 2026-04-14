// ============================================================
// context/AuthContext.js — Global auth state
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ToastAndroid, Platform, Alert } from "react-native";
import { saveUser, getUser, saveToken, getToken, getProfileData, saveProfileData, clearAll } from "../services/storage";
import { initLocalization, setAppLanguage } from "../services/i18n";
import i18n from "../services/i18n";
import { onForceLogout } from "../services/authEvents";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [appLanguage, setAppLanguageState] = useState(i18n.locale);

  // ── Core sign-out that wipes all state ──────────────────────
  const signOut = useCallback(async (showNotice = false) => {
    await clearAll();
    setUser(null);
    setToken(null);
    setProfileData(null);
    if (showNotice) {
      const msg = i18n.locale === 'mr'
        ? 'सत्र संपले. कृपया पुन्हा लॉगिन करा.'
        : 'Session expired. Please log in again.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.LONG);
      } else {
        Alert.alert('Session Expired', msg);
      }
    }
  }, []);

  // ── Bootstrap: restore session from AsyncStorage ────────────
  useEffect(() => {
    (async () => {
      try {
        await initLocalization();
        const [storedUser, storedToken, storedProfile] = await Promise.all([
          getUser(),
          getToken(),
          getProfileData(),
        ]);
        if (storedUser && storedToken) {
          setUser(storedUser);
          setToken(storedToken);
        }
        if (storedProfile) {
          setProfileData(storedProfile);
        }
        setAppLanguageState(i18n.locale);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Subscribe to 401 force-logout from apiClient ─────────────
  // AuthContext mounts once; apiClient emits when any request
  // gets a 401 (token expired / invalid). This wipes state and
  // the AppNavigator automatically shows the Login screen.
  useEffect(() => {
    const unsub = onForceLogout(() => signOut(true));
    return unsub; // cleanup on unmount (never, but good practice)
  }, [signOut]);

  // ── Sign In ─────────────────────────────────────────────────
  const signIn = async (userData, authToken) => {
    const isProfileComplete = !!(
      userData.cropType &&
      userData.soilType &&
      userData.thingSpeakApiKey
    );
    const initProfile = { ...userData, isProfileComplete };

    await Promise.all([
      saveUser(userData),
      saveToken(authToken),
      saveProfileData(initProfile),
    ]);

    if (userData.language) {
      await setAppLanguage(userData.language);
    }

    setUser(userData);
    setToken(authToken);
    setProfileData(initProfile);
  };

  // ── Language Switcher ────────────────────────────────────────
  const changeLanguage = async (langCode) => {
    await setAppLanguage(langCode);
    setAppLanguageState(langCode);
  };

  // ── User / Profile Updaters ──────────────────────────────────
  const updateUser = async (updates) => {
    const updated = { ...user, ...updates };
    await saveUser(updated);
    setUser(updated);
  };

  const updateProfileData = async (updates) => {
    const updated = { ...profileData, ...updates };
    const isProfileComplete = !!(
      updated.cropType &&
      updated.soilType &&
      updated.thingSpeakApiKey
    );
    updated.isProfileComplete = isProfileComplete;
    await saveProfileData(updated);
    setProfileData(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user, token, profileData, loading, appLanguage,
        signIn, signOut, updateUser, updateProfileData, changeLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
