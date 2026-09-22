import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface IconTileButtonProps {
  icon: ReactNode
  label: string
  sublabel?: string
  to?: string
  onClick?: () => void
  accentClassName?: string
  size?: 'md' | 'lg'
}

/** A large icon + label tile — the primary navigation pattern for elderly
 * users (icon-first, single tap), used on the dashboard and Add menu. */
export function IconTileButton({
  icon,
  label,
  sublabel,
  to,
  onClick,
  accentClassName = 'bg-brand-50 text-brand-800',
  size = 'md',
}: IconTileButtonProps) {
  const content = (
    <div
      className={`flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-transparent p-4 text-center shadow-sm transition-transform active:scale-95 ${accentClassName} ${
        size === 'lg' ? 'min-h-[132px]' : 'min-h-[108px]'
      }`}
    >
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <span className="text-base font-bold leading-tight">{label}</span>
      {sublabel && <span className="text-sm font-medium opacity-80">{sublabel}</span>}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block rounded-3xl focus-visible:outline-none" aria-label={label}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-3xl text-left focus-visible:outline-none"
      aria-label={label}
    >
      {content}
    </button>
  )
}
