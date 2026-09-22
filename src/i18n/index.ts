import en from './en'
import mr from './mr'
import type { TranslationKey } from './en'
import type { Language } from '../types/settings'

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, mr }

/** Resolves a translation key for the given language, interpolating any
 * `{placeholder}` tokens with `vars`. Falls back to English, then to the
 * raw key, so a missing/late-loaded translation never crashes the UI. */
export function translate(
  language: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let text = dictionaries[language]?.[key] ?? dictionaries.en[key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value))
    }
  }
  return text
}

export { en, mr }
export type { TranslationKey, Language }
