import { useTranslation } from '../../hooks/useSettings'
import { levelDotClass, levelTextClass } from '../../utils/readingStatus'
import type { ReadingLevel } from '../../utils/readingStatus'
import type { TranslationKey } from '../../i18n'

interface StatusDotProps {
  level: ReadingLevel
  className?: string
}

const labelKeys: Record<ReadingLevel, TranslationKey> = {
  good: 'status.good',
  watch: 'status.watch',
  attention: 'status.attention',
}

/** A colored dot + short text label (never color alone) showing where a
 * reading falls against a general reference range — informational only,
 * never a diagnosis. See `utils/readingStatus.ts`. */
export function StatusDot({ level, className = '' }: StatusDotProps) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${levelTextClass[level]} ${className}`}>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${levelDotClass[level]}`} aria-hidden="true" />
      {t(labelKeys[level])}
    </span>
  )
}
