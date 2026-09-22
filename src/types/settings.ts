export type Language = 'en' | 'mr'

/** Singleton settings record — always stored under key 'app'. */
export interface AppSettings {
  key: 'app'
  language: Language
  largeText: boolean
  notificationsEnabled: boolean
  createdAt: string
  updatedAt: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  key: 'app',
  language: 'en',
  largeText: false,
  notificationsEnabled: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
