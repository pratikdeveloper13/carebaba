import { Link } from 'react-router-dom'

interface EmptyStateProps {
  icon?: string
  title: string
  subtitle?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
}

/** Friendly "nothing here yet" placeholder with a single obvious next step. */
export function EmptyState({
  icon = '📭',
  title,
  subtitle,
  actionLabel,
  actionTo,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-10 text-center">
      <span className="text-5xl" aria-hidden="true">
        {icon}
      </span>
      <p className="text-lg font-bold text-slate-700">{title}</p>
      {subtitle && <p className="text-base text-slate-500">{subtitle}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-2 min-h-[52px] rounded-2xl bg-brand-700 px-5 py-3 text-base font-bold text-white shadow-sm"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 min-h-[52px] rounded-2xl bg-brand-700 px-5 py-3 text-base font-bold text-white shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
