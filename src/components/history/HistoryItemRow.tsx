import { useSettings, useTranslation } from '../../hooks/useSettings'
import { StatusDot } from '../common/StatusDot'
import { formatTimeFriendly } from '../../utils/date'
import { sugarTypeLabelKeys } from '../../utils/labels'
import { getSugarLevel, getBpLevel, getSpo2Level } from '../../utils/readingStatus'
import type { ReadingLevel } from '../../utils/readingStatus'
import type { SugarReading, BloodPressureReading, Spo2Reading } from '../../types/health'

export type HistoryEntry =
  | { kind: 'sugar'; record: SugarReading }
  | { kind: 'bp'; record: BloodPressureReading }
  | { kind: 'spo2'; record: Spo2Reading }

interface HistoryItemRowProps {
  entry: HistoryEntry
  onEdit: () => void
  onDelete: () => void
}

const accent: Record<HistoryEntry['kind'], string> = {
  sugar: 'bg-sugar-bg text-sugar',
  bp: 'bg-bp-bg text-bp',
  spo2: 'bg-spo2-bg text-spo2',
}

const icons: Record<HistoryEntry['kind'], string> = { sugar: '🩸', bp: '❤️', spo2: '🫁' }

function levelFor(entry: HistoryEntry): ReadingLevel {
  if (entry.kind === 'sugar') return getSugarLevel(entry.record.value, entry.record.readingType)
  if (entry.kind === 'bp') return getBpLevel(entry.record.systolic, entry.record.diastolic)
  return getSpo2Level(entry.record.spo2)
}

/** One history row: time, the reading's primary value, secondary detail,
 * and large Edit/Delete tap targets. */
export function HistoryItemRow({ entry, onEdit, onDelete }: HistoryItemRowProps) {
  const { t, language } = useTranslation()
  const { colorIndicatorsEnabled } = useSettings()

  let primary: string
  let secondary: string
  if (entry.kind === 'sugar') {
    primary = `${entry.record.value} ${t('sugar.unit')}`
    secondary = t(sugarTypeLabelKeys[entry.record.readingType])
  } else if (entry.kind === 'bp') {
    primary = `${entry.record.systolic} / ${entry.record.diastolic} ${t('bp.unit')}`
    secondary = entry.record.pulse ? `${t('bp.pulse')} ${entry.record.pulse}` : ''
  } else {
    primary = `${entry.record.spo2}%`
    secondary = entry.record.pulse ? `${t('spo2.pulse')} ${entry.record.pulse}` : ''
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${accent[entry.kind]}`}
        aria-hidden="true"
      >
        {icons[entry.kind]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-500">{formatTimeFriendly(entry.record.time, language)}</p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <p className="text-lg font-extrabold text-slate-900">{primary}</p>
          {colorIndicatorsEnabled && <StatusDot level={levelFor(entry)} />}
        </div>
        {secondary && <p className="text-sm text-slate-600">{secondary}</p>}
        {entry.record.notes && <p className="mt-1 text-sm italic text-slate-500">{entry.record.notes}</p>}
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('common.edit')}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 text-lg text-slate-700"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={t('common.delete')}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-300 text-lg text-red-700"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
