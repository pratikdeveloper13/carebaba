import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getSettings, updateSettings as persistSettings, getCachedLanguage } from '../services/settings/settingsService'
import { DEFAULT_SETTINGS } from '../types/settings'
import type { AppSettings, Language } from '../types/settings'
import { translate } from '../i18n'
import type { TranslationKey } from '../i18n'

interface SettingsContextValue {
  settings: AppSettings
  isLoaded: boolean
  language: Language
  setLanguage: (language: Language) => Promise<void>
  largeText: boolean
  setLargeText: (largeText: boolean) => Promise<void>
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

/**
 * Loads app settings (language, display preferences) from IndexedDB once at
 * startup and keeps them available to the whole tree, including a `t()`
 * translator bound to the current language. Renders instantly using a
 * cached language from localStorage so there's no English flash before the
 * database resolves; IndexedDB remains the source of truth thereafter.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    ...DEFAULT_SETTINGS,
    language: getCachedLanguage(),
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    getSettings()
      .then((loaded) => {
        if (!cancelled) setSettings(loaded)
      })
      .catch(() => {
        // Keep the cached/default settings; app remains usable.
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = settings.language
    document.documentElement.classList.toggle('large-text', settings.largeText)
  }, [settings.language, settings.largeText])

  const setLanguage = async (language: Language) => {
    setSettings((prev) => ({ ...prev, language }))
    try {
      const updated = await persistSettings({ language })
      setSettings(updated)
    } catch {
      // Optimistic value stays; the setting will simply not survive reload.
    }
  }

  const setLargeText = async (largeText: boolean) => {
    setSettings((prev) => ({ ...prev, largeText }))
    try {
      const updated = await persistSettings({ largeText })
      setSettings(updated)
    } catch {
      // Optimistic value stays; the setting will simply not survive reload.
    }
  }

  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(settings.language, key, vars)

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoaded,
        language: settings.language,
        setLanguage,
        largeText: settings.largeText,
        setLargeText,
        t,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider')
  return ctx
}

/** Convenience hook for components that only need translation. */
export function useTranslation() {
  const { t, language } = useSettings()
  return { t, language }
}
