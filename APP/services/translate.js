// ============================================================
// services/translate.js
// On-device translation using Google Translate (free endpoint)
// Used to translate AI-generated English text into Marathi
// ============================================================

/** In-memory cache to avoid double-translating the same string */
const cache = new Map();

/**
 * Translates any English text to Marathi using Google's free translate endpoint.
 * Falls back to original English if the request fails.
 * @param {string} text - English text to translate
 * @returns {Promise<string>} - Translated Marathi text
 */
export const translateToMarathi = async (text) => {
  if (!text || typeof text !== 'string' || text.trim() === '') return text;

  // Return from cache to avoid redundant network calls
  if (cache.has(text)) return cache.get(text);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Response: [ [ ["translated_chunk", "original_chunk"], ...], ... ]
    const translated = data[0]
      .map(item => (item && item[0]) ? item[0] : '')
      .join('');

    cache.set(text, translated);
    return translated;
  } catch (err) {
    console.warn('[Translate] Failed, falling back to English:', err?.message);
    return text;  // Safe fallback: show English
  }
};

/**
 * Translates text only if app language is Marathi.
 * Otherwise returns the original text immediately (no network call).
 * @param {string} text
 * @param {string} lang - 'en' | 'mr'
 */
export const translateIfNeeded = async (text, lang) => {
  if (lang !== 'mr') return text;
  return translateToMarathi(text);
};

/**
 * Translates an array of strings in parallel and returns a translated array.
 */
export const translateArrayIfNeeded = async (arr, lang) => {
  if (lang !== 'mr') return arr;
  return Promise.all(arr.map(item => translateToMarathi(item)));
};

/**
 * Clears the in-memory translation cache.
 * Call this on language switch back to English.
 */
export const clearTranslationCache = () => {
  cache.clear();
};
