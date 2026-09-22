/** Central lookup tables mapping typed enum values to translation keys —
 * keeps every "which i18n key for this status/type" decision in one place
 * (type-checked, no risky template-literal casts at call sites). */
import type { SugarReadingType } from '../types/health'
import type { VaccineStatus } from '../types/vaccine'
import type { TranslationKey } from '../i18n'

export const sugarTypeLabelKeys: Record<SugarReadingType, TranslationKey> = {
  before_breakfast: 'sugar.type.before_breakfast',
  after_breakfast: 'sugar.type.after_breakfast',
  before_lunch: 'sugar.type.before_lunch',
  after_lunch: 'sugar.type.after_lunch',
  before_dinner: 'sugar.type.before_dinner',
  after_dinner: 'sugar.type.after_dinner',
}

export const sugarTypeIcons: Record<SugarReadingType, string> = {
  before_breakfast: '🌅',
  after_breakfast: '🍳',
  before_lunch: '☀️',
  after_lunch: '🍛',
  before_dinner: '🌆',
  after_dinner: '🍽️',
}

export const vaccineStatusLabelKeys: Record<VaccineStatus, TranslationKey> = {
  upcoming: 'vaccine.status.upcoming',
  missed: 'vaccine.status.missed',
  completed: 'vaccine.status.completed',
}
