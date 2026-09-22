import { SUGAR_READING_TYPES } from '../../types/health'
import type { SugarReadingType } from '../../types/health'
import { useTranslation } from '../../hooks/useSettings'
import { sugarTypeIcons as icons, sugarTypeLabelKeys as labelKeys } from '../../utils/labels'

interface ReadingTypeSelectorProps {
  value: SugarReadingType | null
  onChange: (type: SugarReadingType) => void
  error?: string | null
}

/** One-tap icon grid for choosing when a sugar reading was taken relative
 * to meals — the single most important input on the Add Sugar screen. */
export function ReadingTypeSelector({ value, onChange, error }: ReadingTypeSelectorProps) {
  const { t } = useTranslation()
  return (
    <div>
      <p className="mb-2 text-base font-bold text-slate-800">{t('sugar.readingType')}</p>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('sugar.readingType')}>
        {SUGAR_READING_TYPES.map((type) => {
          const selected = value === type
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(type)}
              className={`flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-colors ${
                selected
                  ? 'border-sugar bg-sugar-bg text-sugar'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-3xl" aria-hidden="true">
                {icons[type]}
              </span>
              <span className="text-sm font-bold leading-tight">{t(labelKeys[type])}</span>
            </button>
          )
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
