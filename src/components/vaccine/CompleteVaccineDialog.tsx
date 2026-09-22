import { useState } from 'react'
import { DateTimeFields } from '../common/DateTimeFields'
import { FormField, inputClass } from '../common/FormField'
import { Button } from '../common/Button'
import { useTranslation } from '../../hooks/useSettings'
import { markVaccineCompleted } from '../../services/vaccine/vaccineService'
import { todayIso, nowTime } from '../../utils/date'
import type { VaccineRecord } from '../../types/vaccine'

interface CompleteVaccineDialogProps {
  vaccine: VaccineRecord
  onCompleted: (record: VaccineRecord) => void
  onCancel: () => void
}

/** Captures the actual vaccination date/time/notes when marking a vaccine
 * as completed — a small focused dialog rather than a full page. */
export function CompleteVaccineDialog({ vaccine, onCompleted, onCancel }: CompleteVaccineDialogProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState(todayIso())
  const [time, setTime] = useState(nowTime())
  const [notes, setNotes] = useState(vaccine.notes ?? '')
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    setSaving(true)
    try {
      const updated = await markVaccineCompleted(vaccine, {
        completedDate: date,
        completedTime: time,
        notes: notes.trim() || undefined,
      })
      onCompleted(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-vaccine-title"
      onClick={onCancel}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="complete-vaccine-title" className="text-xl font-bold text-slate-900">
          {t('vaccine.completeTitle')}
        </h2>
        <p className="mt-1 text-base text-slate-600">{vaccine.name}</p>
        <div className="mt-4 flex flex-col gap-4">
          <DateTimeFields
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            dateLabel={t('vaccine.completedDate')}
            timeLabel={t('vaccine.completedTime')}
            timeRequired={false}
          />
          <FormField label={t('common.notes')} htmlFor="complete-vaccine-notes" hint={t('common.optional')}>
            <textarea
              id="complete-vaccine-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </FormField>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={handleConfirm} disabled={saving} fullWidth>
            {saving ? t('common.saving') : t('vaccine.markCompleted')}
          </Button>
          <Button variant="secondary" onClick={onCancel} fullWidth disabled={saving}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  )
}
