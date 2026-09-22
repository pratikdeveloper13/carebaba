/**
 * Field validation for health-reading and vaccine forms.
 *
 * Each function returns `null` when the value is valid, or a `TranslationKey`
 * (resolved via `t()` by the calling component) when it is not — so every
 * validation message is friendly, fully translatable, and type-checked
 * against the i18n dictionaries. Never a raw/technical error string.
 */
import type { TranslationKey } from '../i18n'

export function validateSugarValue(raw: string): TranslationKey | null {
  if (raw.trim() === '') return 'validation.sugarRequired'
  const value = Number(raw)
  if (!Number.isFinite(value)) return 'validation.sugarInvalid'
  if (value <= 0) return 'validation.sugarInvalid'
  if (value > 900) return 'validation.sugarRange'
  return null
}

export function validateSystolic(raw: string): TranslationKey | null {
  if (raw.trim() === '') return 'validation.systolicRequired'
  const value = Number(raw)
  if (!Number.isFinite(value)) return 'validation.systolicInvalid'
  if (value < 40 || value > 300) return 'validation.systolicRange'
  return null
}

export function validateDiastolic(raw: string): TranslationKey | null {
  if (raw.trim() === '') return 'validation.diastolicRequired'
  const value = Number(raw)
  if (!Number.isFinite(value)) return 'validation.diastolicInvalid'
  if (value < 20 || value > 250) return 'validation.diastolicRange'
  return null
}

export function validateBpRelationship(systolicRaw: string, diastolicRaw: string): TranslationKey | null {
  const systolic = Number(systolicRaw)
  const diastolic = Number(diastolicRaw)
  if (Number.isFinite(systolic) && Number.isFinite(diastolic) && systolic <= diastolic) {
    return 'validation.bpRelationship'
  }
  return null
}

export function validateSpo2Value(raw: string): TranslationKey | null {
  if (raw.trim() === '') return 'validation.spo2Required'
  const value = Number(raw)
  if (!Number.isFinite(value)) return 'validation.spo2Invalid'
  if (value <= 0 || value > 100) return 'validation.spo2Range'
  return null
}

export function validatePulse(raw: string): TranslationKey | null {
  if (raw.trim() === '') return null // optional field
  const value = Number(raw)
  if (!Number.isFinite(value)) return 'validation.pulseInvalid'
  if (value < 20 || value > 250) return 'validation.pulseRange'
  return null
}

export function validateSugarType(value: string | null): TranslationKey | null {
  if (!value) return 'validation.sugarTypeRequired'
  return null
}

export function validateVaccineName(raw: string): TranslationKey | null {
  if (raw.trim() === '') return 'validation.vaccineNameRequired'
  return null
}

export function validateDueDate(raw: string): TranslationKey | null {
  if (raw.trim() === '') return 'validation.dueDateRequired'
  return null
}

export function validateRequiredDate(raw: string): TranslationKey | null {
  if (raw.trim() === '') return 'validation.dateRequired'
  return null
}

export function validateRequiredTime(raw: string): TranslationKey | null {
  if (raw.trim() === '') return 'validation.timeRequired'
  return null
}
