import { useState } from 'react'
import type { FormEvent } from 'react'
import { FormField, inputClass, inputClassError } from '../common/FormField'
import { DateTimeFields } from '../common/DateTimeFields'
import { Button } from '../common/Button'
import { useTranslation } from '../../hooks/useSettings'
import { addBpReading, updateBpReading } from '../../services/health/healthService'
import { todayIso, nowTime } from '../../utils/date'
import {
  validateSystolic,
  validateDiastolic,
  validateBpRelationship,
  validatePulse,
  validateRequiredDate,
  validateRequiredTime,
} from '../../utils/validation'
import type { BloodPressureReading } from '../../types/health'
import type { TranslationKey } from '../../i18n'

interface BPFormProps {
  existing?: BloodPressureReading
  onSaved: (record: BloodPressureReading, mode: 'added' | 'updated') => void
  onCancel: () => void
}

interface FormErrors {
  systolic?: TranslationKey
  diastolic?: TranslationKey
  pulse?: TranslationKey
  date?: TranslationKey
  time?: TranslationKey
}

export function BPForm({ existing, onSaved, onCancel }: BPFormProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState(existing?.date ?? todayIso())
  const [time, setTime] = useState(existing?.time ?? nowTime())
  const [systolic, setSystolic] = useState(existing ? String(existing.systolic) : '')
  const [diastolic, setDiastolic] = useState(existing ? String(existing.diastolic) : '')
  const [pulse, setPulse] = useState(existing?.pulse ? String(existing.pulse) : '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const validate = (): boolean => {
    const nextErrors: FormErrors = {
      systolic: validateSystolic(systolic) ?? undefined,
      diastolic: validateDiastolic(diastolic) ?? undefined,
      pulse: validatePulse(pulse) ?? undefined,
      date: validateRequiredDate(date) ?? undefined,
      time: validateRequiredTime(time) ?? undefined,
    }
    if (!nextErrors.systolic && !nextErrors.diastolic) {
      nextErrors.systolic = validateBpRelationship(systolic, diastolic) ?? undefined
    }
    setErrors(nextErrors)
    return !Object.values(nextErrors).some(Boolean)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setSaveError(null)
    try {
      const input = {
        date,
        time,
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        pulse: pulse.trim() ? Number(pulse) : undefined,
        notes: notes.trim() || undefined,
      }
      if (existing) {
        const updated = await updateBpReading(existing.id, input, existing)
        onSaved(updated, 'updated')
      } else {
        const created = await addBpReading(input)
        onSaved(created, 'added')
      }
    } catch {
      setSaveError(t('errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('bp.systolic')}
          htmlFor="bp-systolic"
          required
          error={errors.systolic ? t(errors.systolic) : null}
        >
          <input
            id="bp-systolic"
            type="number"
            inputMode="numeric"
            autoFocus
            placeholder="128"
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
            className={errors.systolic ? inputClassError : inputClass}
          />
        </FormField>
        <FormField
          label={t('bp.diastolic')}
          htmlFor="bp-diastolic"
          required
          error={errors.diastolic ? t(errors.diastolic) : null}
        >
          <input
            id="bp-diastolic"
            type="number"
            inputMode="numeric"
            placeholder="78"
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
            className={errors.diastolic ? inputClassError : inputClass}
          />
        </FormField>
      </div>

      <FormField
        label={`${t('bp.pulse')} (${t('bp.pulseUnit')})`}
        htmlFor="bp-pulse"
        hint={t('common.optional')}
        error={errors.pulse ? t(errors.pulse) : null}
      >
        <input
          id="bp-pulse"
          type="number"
          inputMode="numeric"
          placeholder="72"
          value={pulse}
          onChange={(e) => setPulse(e.target.value)}
          className={errors.pulse ? inputClassError : inputClass}
        />
      </FormField>

      <DateTimeFields
        date={date}
        time={time}
        onDateChange={setDate}
        onTimeChange={setTime}
        dateError={errors.date ? t(errors.date) : null}
        timeError={errors.time ? t(errors.time) : null}
      />

      <FormField label={t('common.notes')} htmlFor="bp-notes" hint={t('common.optional')}>
        <textarea
          id="bp-notes"
          rows={2}
          placeholder={t('common.notesPlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </FormField>

      {saveError && <p className="text-sm font-semibold text-red-700">{saveError}</p>}

      <div className="flex flex-col gap-3 pt-2">
        <Button type="submit" disabled={saving} fullWidth>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} fullWidth disabled={saving}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
