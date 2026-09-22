import { useSettings } from '../../hooks/useSettings'

/** English | मराठी toggle. Large tap targets, current choice always visible. */
export function LanguageSwitch() {
  const { language, setLanguage } = useSettings()
  return (
    <div
      className="flex items-center gap-1 rounded-full bg-slate-100 p-1 text-sm font-bold"
      role="group"
      aria-label="Language / भाषा"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={`min-h-[40px] rounded-full px-3 py-1.5 transition-colors ${
          language === 'en' ? 'bg-brand-700 text-white' : 'text-slate-600'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('mr')}
        aria-pressed={language === 'mr'}
        className={`min-h-[40px] rounded-full px-3 py-1.5 transition-colors ${
          language === 'mr' ? 'bg-brand-700 text-white' : 'text-slate-600'
        }`}
      >
        मराठी
      </button>
    </div>
  )
}
