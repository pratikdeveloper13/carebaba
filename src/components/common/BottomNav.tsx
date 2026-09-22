import { NavLink } from 'react-router-dom'
import { useTranslation } from '../../hooks/useSettings'
import type { TranslationKey } from '../../i18n'

const items: { to: string; icon: string; labelKey: TranslationKey }[] = [
  { to: '/', icon: '🏠', labelKey: 'nav.home' },
  { to: '/add', icon: '➕', labelKey: 'nav.add' },
  { to: '/history', icon: '📋', labelKey: 'nav.history' },
  { to: '/vaccines', icon: '💉', labelKey: 'nav.vaccines' },
  { to: '/settings', icon: '⚙️', labelKey: 'nav.settings' },
]

/** Fixed bottom navigation — the app's primary navigation on every screen
 * size, per the elderly-friendly "few, large, obvious options" principle. */
export function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-h-[64px] flex-col items-center justify-center gap-0.5 py-2 text-xs font-bold ${
                  isActive ? 'text-brand-700' : 'text-slate-500'
                }`
              }
            >
              <span className="text-2xl" aria-hidden="true">
                {item.icon}
              </span>
              <span>{t(item.labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
