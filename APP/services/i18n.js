import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Static lazy-load dictionary bounds to prevent massive JS bundle parses
import enData from '../locales/en.json';
import mrData from '../locales/mr.json';

const i18n = new I18n({
  en: enData,
  mr: mrData,
});

i18n.enableFallback = true;
// Default strictly to English if translation maps fail
i18n.defaultLocale = 'en';
// Load device locales to start, but we will overwrite this dynamically from MongoDB
const locales = Localization.getLocales();
i18n.locale = locales.length > 0 ? locales[0].languageCode : 'en';

export const LANGUAGE_STORAGE_KEY = '@app_language';

/**
 * Initializes the language synchronously pulling from local AsyncStorage cache
 * allowing the application to flash the correct text elements instantly.
 */
export const initLocalization = async () => {
  try {
    const cachedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (cachedLanguage && (cachedLanguage === 'en' || cachedLanguage === 'mr')) {
      i18n.locale = cachedLanguage;
    }
  } catch (error) {
    console.warn("Failed to natively load language preferences", error);
  }
};

/**
 * Commits a language overwrite both into the global React rendering pool
 * and heavily onto the physical caching layer.
 */
export const setAppLanguage = async (langCode) => {
  try {
    i18n.locale = langCode;
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
  } catch (error) {
    console.warn("Failed to natively save language preferences", error);
  }
};

/**
 * Standard utility wrapper protecting translation requests.
 */
export const t = (key, options) => {
  return i18n.t(key, options);
};

export default i18n;
