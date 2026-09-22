/**
 * Color-coded "at a glance" status for a reading — general reference
 * ranges only, never a diagnosis. Pairs with a text label everywhere it's
 * shown (never color alone), and can be turned off in Settings.
 *
 * These bands are widely published general-adult reference ranges (the
 * same kind of thing printed on a home BP monitor or glucometer), NOT a
 * personalized target — a doctor may set different targets for a specific
 * person. Never phrase these as a diagnosis ("you have hypertension") —
 * only ever "in range" / "borderline" / "outside range".
 */
import type { SugarReadingType } from '../types/health'

export type ReadingLevel = 'good' | 'watch' | 'attention'

const isAfterMeal: Record<SugarReadingType, boolean> = {
  before_breakfast: false,
  after_breakfast: true,
  before_lunch: false,
  after_lunch: true,
  before_dinner: false,
  after_dinner: true,
}

export function getSugarLevel(value: number, readingType: SugarReadingType): ReadingLevel {
  if (value < 70) return 'attention' // low
  if (isAfterMeal[readingType]) {
    if (value < 180) return 'good'
    if (value < 250) return 'watch'
    return 'attention'
  }
  if (value < 130) return 'good'
  if (value < 180) return 'watch'
  return 'attention'
}

export function getBpLevel(systolic: number, diastolic: number): ReadingLevel {
  if (systolic < 90 || diastolic < 60) return 'attention' // low
  if (systolic >= 140 || diastolic >= 90) return 'attention' // high
  if (systolic >= 120 || diastolic >= 80) return 'watch'
  return 'good'
}

export function getSpo2Level(value: number): ReadingLevel {
  if (value >= 95) return 'good'
  if (value >= 90) return 'watch'
  return 'attention'
}

export const levelDotClass: Record<ReadingLevel, string> = {
  good: 'bg-ok',
  watch: 'bg-warn',
  attention: 'bg-danger',
}

export const levelTextClass: Record<ReadingLevel, string> = {
  good: 'text-ok',
  watch: 'text-warn',
  attention: 'text-danger',
}
