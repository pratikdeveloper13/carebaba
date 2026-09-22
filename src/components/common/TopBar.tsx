import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  showBack?: boolean
  right?: ReactNode
}

/** Sticky page header: optional back button, title, optional action slot. */
export function TopBar({ title, showBack = false, right }: TopBarProps) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur">
      {showBack && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl text-slate-700 hover:bg-slate-100"
        >
          ←
        </button>
      )}
      <h1 className="flex-1 truncate text-xl font-bold text-slate-900">{title}</h1>
      {right}
    </header>
  )
}
