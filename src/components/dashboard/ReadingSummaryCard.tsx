import { Link } from 'react-router-dom'
import { StatusDot } from '../common/StatusDot'
import type { ReadingLevel } from '../../utils/readingStatus'

interface ReadingSummaryCardProps {
  icon: string
  title: string
  valueText?: string
  subText?: string
  countText?: string
  emptyText: string
  addTo: string
  addLabel: string
  accentClassName: string
  /** Omit to hide the color indicator entirely (e.g. user turned it off in Settings). */
  level?: ReadingLevel
}

/** Dashboard tile for one reading type's "today" snapshot — latest value
 * (or a friendly empty state) plus a quick add shortcut. */
export function ReadingSummaryCard({
  icon,
  title,
  valueText,
  subText,
  countText,
  emptyText,
  addTo,
  addLabel,
  accentClassName,
  level,
}: ReadingSummaryCardProps) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${accentClassName}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-800">{title}</p>
          {valueText ? (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <p className="truncate text-2xl font-extrabold text-slate-900">{valueText}</p>
              {level && <StatusDot level={level} />}
            </div>
          ) : (
            <p className="text-base text-slate-500">{emptyText}</p>
          )}
          {subText && <p className="text-sm text-slate-500">{subText}</p>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {countText ? <span className="text-sm font-semibold text-slate-500">{countText}</span> : <span />}
        <Link
          to={addTo}
          className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold ${accentClassName}`}
        >
          {addLabel}
        </Link>
      </div>
    </div>
  )
}
