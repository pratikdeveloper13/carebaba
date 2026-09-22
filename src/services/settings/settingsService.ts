/** Business logic for application settings (language, display, notifications). */
import { STORE, getRecord, putRecord } from '../storage/storageService'
import { DEFAULT_SETTINGS } from '../../types/settings'
import type { AppSettings, Language } from '../../types/settings'

const SETTINGS_KEY = 'app'
// Mirrors the last-known language in localStorage purely so the very first
// paint (before IndexedDB has resolved) can render in the right language
// instead of always flashing English first. IndexedDB remains the source
// of truth for every read/write after that.
const LANG_CACHE_KEY = 'dad-health-tracker:lang'

export function getCachedLanguage(): Language {
  try {
    const cached = localStorage.getItem(LANG_CACHE_KEY)
    return cached === 'mr' ? 'mr' : 'en'
  } catch {
    return 'en'
  }
}

function cacheLanguage(language: Language) {
  try {
    localStorage.setItem(LANG_CACHE_KEY, language)
  } catch {
    // localStorage may be unavailable (private browsing); non-fatal.
  }
}

export async function getSettings(): Promise<AppSettings> {
  const existing = await getRecord(STORE.settings, SETTINGS_KEY)
  if (existing) {
    // Merge over defaults so a settings record saved by an older version of
    // the app (missing a field added since) still gets a sensible value
    // instead of `undefined`.
    const merged: AppSettings = { ...DEFAULT_SETTINGS, ...existing }
    cacheLanguage(merged.language)
    return merged
  }
  await putRecord(STORE.settings, DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

export async function updateSettings(updates: Partial<Omit<AppSettings, 'key' | 'createdAt'>>): Promise<AppSettings> {
  const current = await getSettings()
  const next: AppSettings = { ...current, ...updates, key: 'app', updatedAt: new Date().toISOString() }
  await putRecord(STORE.settings, next)
  if (updates.language) cacheLanguage(updates.language)
  return next
}
