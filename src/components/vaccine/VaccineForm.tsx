import { useState } from 'react'
import type { FormEvent } from 'react'
import { FormField, inputClass, inputClassError } from '../common/FormField'
import { DateTimeFields } from '../common/DateTimeFields'
import { Button } from '../common/Button'
import { useTranslation } from '../../hooks/useSettings'
import { addVaccine, updateVaccine } from '../../services/vaccine/vaccineService'
import { todayIso } from '../../utils/date'
import { validateVaccineName, validateDueDate } from '../../utils/validation'
import type { VaccineRecord } from '../../types/vaccine'
import type { TranslationKey } from '../../i18n'

interface VaccineFormProps {
  existing?: VaccineRecord
  onSaved: (record: VaccineRecord, mode: 'added' | 'updated') => void
  onCancel: () => void
}

interface FormErrors {
  name?: TranslationKey
  dueDate?: TranslationKey
}

export function VaccineForm({ existing, onSaved, onCancel }: VaccineFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(existing?.name ?? '')
  const [doseNumber, setDoseNumber] = useState(existing?.doseNumber ? String(existing.doseNumber) : '')
  const [totalDoses, setTotalDoses] = useState(existing?.totalDoses ? String(existing.totalDoses) : '')
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? todayIso())
  const [dueTime, setDueTime] = useState(existing?.dueTime ?? '')
  const [doctorOrHospital, setDoctorOrHospital] = useState(existing?.doctorOrHospital ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const validate = (): boolean => {
    const nextErrors: FormErrors = {
      name: validateVaccineName(name) ?? undefined,
      dueDate: validateDueDate(dueDate) ?? undefined,
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
        name: name.trim(),
        doseNumber: doseNumber.trim() ? Number(doseNumber) : undefined,
        totalDoses: totalDoses.trim() ? Number(totalDoses) : undefined,
        dueDate,
        dueTime: dueTime.trim() || undefined,
        doctorOrHospital: doctorOrHospital.trim() || undefined,
        notes: notes.trim() || undefined,
      }
      if (existing) {
        const updated = await updateVaccine(existing.id, input, existing)
        onSaved(updated, 'updated')
      } else {
        const created = await addVaccine(input)
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
      <FormField label={t('vaccine.name')} htmlFor="vaccine-name" required error={errors.name ? t(errors.name) : null}>
        <input
          id="vaccine-name"
          type="text"
          autoFocus
          placeholder={t('vaccine.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={errors.name ? inputClassError : inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('vaccine.doseNumber')} htmlFor="vaccine-dose" hint={t('common.optional')}>
          <input
            id="vaccine-dose"
            type="number"
            inputMode="numeric"
            placeholder="1"
            value={doseNumber}
            onChange={(e) => setDoseNumber(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label={t('vaccine.totalDoses')} htmlFor="vaccine-total-doses" hint={t('common.optional')}>
          <input
            id="vaccine-total-doses"
            type="number"
            inputMode="numeric"
            placeholder="3"
            value={totalDoses}
            onChange={(e) => setTotalDoses(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>

      <DateTimeFields
        date={dueDate}
        time={dueTime}
        onDateChange={setDueDate}
        onTimeChange={setDueTime}
        dateError={errors.dueDate ? t(errors.dueDate) : null}
        dateLabel={t('vaccine.dueDate')}
        timeLabel={t('vaccine.dueTime')}
        timeRequired={false}
      />

      <FormField label={t('vaccine.doctorHospital')} htmlFor="vaccine-doctor" hint={t('common.optional')}>
        <input
          id="vaccine-doctor"
          type="text"
          placeholder={t('vaccine.doctorHospitalPlaceholder')}
          value={doctorOrHospital}
          onChange={(e) => setDoctorOrHospital(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label={t('common.notes')} htmlFor="vaccine-notes" hint={t('common.optional')}>
        <textarea
          id="vaccine-notes"
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
