/**
 * Core health-reading data models.
 *
 * Dates are stored as ISO date strings (YYYY-MM-DD) and times as 24-hour
 * "HH:mm" strings so they sort and filter predictably regardless of the
 * device's locale. `createdAt` / `updatedAt` are full ISO-8601 timestamps.
 */

export type SugarReadingType =
  | 'before_breakfast'
  | 'after_breakfast'
  | 'before_lunch'
  | 'after_lunch'
  | 'before_dinner'
  | 'after_dinner'

export const SUGAR_READING_TYPES: SugarReadingType[] = [
  'before_breakfast',
  'after_breakfast',
  'before_lunch',
  'after_lunch',
  'before_dinner',
  'after_dinner',
]

export interface SugarReading {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  value: number // mg/dL
  readingType: SugarReadingType
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface BloodPressureReading {
  id: string
  date: string
  time: string
  systolic: number
  diastolic: number
  pulse?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Spo2Reading {
  id: string
  date: string
  time: string
  spo2: number // percentage
  pulse?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

/** Discriminated identifier for the three health record kinds, used by
 * generic UI (History, Trends, Add-menu) that treats them uniformly. */
export type HealthRecordType = 'sugar' | 'bp' | 'spo2'

export type NewSugarReading = Omit<SugarReading, 'id' | 'createdAt' | 'updatedAt'>
export type NewBloodPressureReading = Omit<BloodPressureReading, 'id' | 'createdAt' | 'updatedAt'>
export type NewSpo2Reading = Omit<Spo2Reading, 'id' | 'createdAt' | 'updatedAt'>
