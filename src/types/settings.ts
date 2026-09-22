export type Language = 'en' | 'mr'

/** Singleton settings record — always stored under key 'app'. */
export interface AppSettings {
  key: 'app'
  language: Language
  largeText: boolean
  colorIndicatorsEnabled: boolean
  notificationsEnabled: boolean
  createdAt: string
  updatedAt: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  key: 'app',
  language: 'en',
  largeText: false,
  colorIndicatorsEnabled: true,
  notificationsEnabled: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
