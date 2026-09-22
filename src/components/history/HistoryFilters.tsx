import { useTranslation } from '../../hooks/useSettings'
import { inputClass } from '../common/FormField'
import type { TranslationKey } from '../../i18n'

export type HistoryRange = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom'
export type HistoryTypeFilter = 'all' | 'sugar' | 'bp' | 'spo2'

interface HistoryFiltersProps {
  range: HistoryRange
  onRangeChange: (range: HistoryRange) => void
  typeFilter: HistoryTypeFilter
  onTypeFilterChange: (type: HistoryTypeFilter) => void
  customFrom: string
  customTo: string
  onCustomFromChange: (value: string) => void
  onCustomToChange: (value: string) => void
}

const ranges: { value: HistoryRange; labelKey: TranslationKey }[] = [
  { value: 'today', labelKey: 'history.range.today' },
  { value: 'yesterday', labelKey: 'history.range.yesterday' },
  { value: 'last7', labelKey: 'history.range.last7' },
  { value: 'last30', labelKey: 'history.range.last30' },
  { value: 'custom', labelKey: 'history.range.custom' },
]

const types: { value: HistoryTypeFilter; labelKey: TranslationKey; icon: string }[] = [
  { value: 'all', labelKey: 'history.type.all', icon: '📋' },
  { value: 'sugar', labelKey: 'history.type.sugar', icon: '🩸' },
  { value: 'bp', labelKey: 'history.type.bp', icon: '❤️' },
  { value: 'spo2', labelKey: 'history.type.spo2', icon: '🫁' },
]

/** Time-period and reading-type filter pills, plus a custom date range
 * picker that appears only when "Custom Range" is selected. */
export function HistoryFilters({
  range,
  onRangeChange,
  typeFilter,
  onTypeFilterChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: HistoryFiltersProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{t('history.filterRange')}</p>
        <div className="flex flex-wrap gap-2">
          {ranges.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onRangeChange(r.value)}
              aria-pressed={range === r.value}
              className={`min-h-[44px] rounded-full border-2 px-4 py-2 text-sm font-bold ${
                range === r.value ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              {t(r.labelKey)}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="history-from" className="mb-1 block text-sm font-bold text-slate-700">
                {t('history.from')}
              </label>
              <input
                id="history-from"
                type="date"
                value={customFrom}
                onChange={(e) => onCustomFromChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="history-to" className="mb-1 block text-sm font-bold text-slate-700">
                {t('history.to')}
              </label>
              <input
                id="history-to"
                type="date"
                value={customTo}
                onChange={(e) => onCustomToChange(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>
      <div>
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{t('history.filterType')}</p>
        <div className="flex flex-wrap gap-2">
          {types.map((ty) => (
            <button
              key={ty.value}
              type="button"
              onClick={() => onTypeFilterChange(ty.value)}
              aria-pressed={typeFilter === ty.value}
              className={`flex min-h-[44px] items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold ${
                typeFilter === ty.value
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <span aria-hidden="true">{ty.icon}</span>
              {t(ty.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
