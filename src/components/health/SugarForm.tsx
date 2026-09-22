import { useState } from 'react'
import type { FormEvent } from 'react'
import { FormField, inputClass, inputClassError } from '../common/FormField'
import { DateTimeFields } from '../common/DateTimeFields'
import { ReadingTypeSelector } from './ReadingTypeSelector'
import { Button } from '../common/Button'
import { useTranslation } from '../../hooks/useSettings'
import { addSugarReading, updateSugarReading } from '../../services/health/healthService'
import { todayIso, nowTime } from '../../utils/date'
import {
  validateSugarValue,
  validateSugarType,
  validateRequiredDate,
  validateRequiredTime,
} from '../../utils/validation'
import type { SugarReading, SugarReadingType } from '../../types/health'
import type { TranslationKey } from '../../i18n'

interface SugarFormProps {
  existing?: SugarReading
  onSaved: (record: SugarReading, mode: 'added' | 'updated') => void
  onCancel: () => void
}

interface FormErrors {
  value?: TranslationKey
  readingType?: TranslationKey
  date?: TranslationKey
  time?: TranslationKey
}

export function SugarForm({ existing, onSaved, onCancel }: SugarFormProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState(existing?.date ?? todayIso())
  const [time, setTime] = useState(existing?.time ?? nowTime())
  const [value, setValue] = useState(existing ? String(existing.value) : '')
  const [readingType, setReadingType] = useState<SugarReadingType | null>(existing?.readingType ?? null)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const validate = (): boolean => {
    const nextErrors: FormErrors = {
      value: validateSugarValue(value) ?? undefined,
      readingType: validateSugarType(readingType) ?? undefined,
      date: validateRequiredDate(date) ?? undefined,
      time: validateRequiredTime(time) ?? undefined,
    }
    setErrors(nextErrors)
    return !Object.values(nextErrors).some(Boolean)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate() || !readingType) return
    setSaving(true)
    setSaveError(null)
    try {
      const input = { date, time, value: Number(value), readingType, notes: notes.trim() || undefined }
      if (existing) {
        const updated = await updateSugarReading(existing.id, input, existing)
        onSaved(updated, 'updated')
      } else {
        const created = await addSugarReading(input)
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
        label={`${t('sugar.value')} (${t('sugar.unit')})`}
        htmlFor="sugar-value"
        required
        error={errors.value ? t(errors.value) : null}
      >
        <input
          id="sugar-value"
          type="number"
          inputMode="decimal"
          autoFocus
          placeholder="e.g. 120"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={errors.value ? inputClassError : inputClass}
        />
      </FormField>

      <ReadingTypeSelector
        value={readingType}
        onChange={setReadingType}
        error={errors.readingType ? t(errors.readingType) : null}
      />

      <DateTimeFields
        date={date}
        time={time}
        onDateChange={setDate}
        onTimeChange={setTime}
        dateError={errors.date ? t(errors.date) : null}
        timeError={errors.time ? t(errors.time) : null}
      />

      <FormField label={t('common.notes')} htmlFor="sugar-notes" hint={t('common.optional')}>
        <textarea
          id="sugar-notes"
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
