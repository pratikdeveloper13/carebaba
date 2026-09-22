import { FormField, inputClass, inputClassError } from './FormField'
import { useTranslation } from '../../hooks/useSettings'

interface DateTimeFieldsProps {
  date: string
  time: string
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
  dateError?: string | null
  timeError?: string | null
  dateLabel?: string
  timeLabel?: string
  showTime?: boolean
  timeRequired?: boolean
}

/** Paired date + time inputs, defaulted by the caller to "now" — reused by
 * every reading and vaccine form so date/time entry behaves identically
 * everywhere in the app. */
export function DateTimeFields({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
  dateLabel,
  timeLabel,
  showTime = true,
  timeRequired = true,
}: DateTimeFieldsProps) {
  const { t } = useTranslation()
  return (
    <div className={`grid gap-4 ${showTime ? 'grid-cols-2' : 'grid-cols-1'}`}>
      <FormField
        label={dateLabel ?? t('common.date')}
        htmlFor="field-date"
        required
        error={dateError}
      >
        <input
          id="field-date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className={dateError ? inputClassError : inputClass}
        />
      </FormField>
      {showTime && (
        <FormField
          label={timeLabel ?? t('common.time')}
          htmlFor="field-time"
          required={timeRequired}
          error={timeError}
        >
          <input
            id="field-time"
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className={timeError ? inputClassError : inputClass}
          />
        </FormField>
      )}
    </div>
  )
}
