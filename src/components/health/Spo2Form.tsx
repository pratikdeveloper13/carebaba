import { useState } from 'react'
import type { FormEvent } from 'react'
import { FormField, inputClass, inputClassError } from '../common/FormField'
import { DateTimeFields } from '../common/DateTimeFields'
import { Button } from '../common/Button'
import { useTranslation } from '../../hooks/useSettings'
import { addSpo2Reading, updateSpo2Reading } from '../../services/health/healthService'
import { todayIso, nowTime } from '../../utils/date'
import { validateSpo2Value, validatePulse, validateRequiredDate, validateRequiredTime } from '../../utils/validation'
import type { Spo2Reading } from '../../types/health'
import type { TranslationKey } from '../../i18n'

interface Spo2FormProps {
  existing?: Spo2Reading
  onSaved: (record: Spo2Reading, mode: 'added' | 'updated') => void
  onCancel: () => void
}

interface FormErrors {
  spo2?: TranslationKey
  pulse?: TranslationKey
  date?: TranslationKey
  time?: TranslationKey
}

export function Spo2Form({ existing, onSaved, onCancel }: Spo2FormProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState(existing?.date ?? todayIso())
  const [time, setTime] = useState(existing?.time ?? nowTime())
  const [spo2, setSpo2] = useState(existing ? String(existing.spo2) : '')
  const [pulse, setPulse] = useState(existing?.pulse ? String(existing.pulse) : '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const validate = (): boolean => {
    const nextErrors: FormErrors = {
      spo2: validateSpo2Value(spo2) ?? undefined,
      pulse: validatePulse(pulse) ?? undefined,
      date: validateRequiredDate(date) ?? undefined,
      time: validateRequiredTime(time) ?? undefined,
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
        spo2: Number(spo2),
        pulse: pulse.trim() ? Number(pulse) : undefined,
        notes: notes.trim() || undefined,
      }
      if (existing) {
        const updated = await updateSpo2Reading(existing.id, input, existing)
        onSaved(updated, 'updated')
      } else {
        const created = await addSpo2Reading(input)
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
      <FormField
        label={`${t('spo2.value')}`}
        htmlFor="spo2-value"
        required
        error={errors.spo2 ? t(errors.spo2) : null}
      >
        <input
          id="spo2-value"
          type="number"
          inputMode="numeric"
          autoFocus
          placeholder="97"
          value={spo2}
          onChange={(e) => setSpo2(e.target.value)}
          className={errors.spo2 ? inputClassError : inputClass}
        />
      </FormField>

      <FormField
        label={`${t('spo2.pulse')} (${t('bp.pulseUnit')})`}
        htmlFor="spo2-pulse"
        hint={t('common.optional')}
        error={errors.pulse ? t(errors.pulse) : null}
      >
        <input
          id="spo2-pulse"
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

      <FormField label={t('common.notes')} htmlFor="spo2-notes" hint={t('common.optional')}>
        <textarea
          id="spo2-notes"
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
