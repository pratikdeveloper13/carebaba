import type { Language } from '../types/settings'

/** Pads a number to 2 digits, e.g. 5 -> "05". */
function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Today's date as an ISO date string (YYYY-MM-DD), in local time. */
export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Current time as "HH:mm", in local time. */
export function nowTime(): string {
  const d = new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Adds (or subtracts, with a negative value) whole days to an ISO date string. */
export function addDaysIso(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Number of whole days between two ISO date strings (b - a). */
export function daysBetweenIso(aIso: string, bIso: string): number {
  const [ay, am, ad] = aIso.split('-').map(Number)
  const [by, bm, bd] = bIso.split('-').map(Number)
  const a = Date.UTC(ay, (am ?? 1) - 1, ad ?? 1)
  const b = Date.UTC(by, (bm ?? 1) - 1, bd ?? 1)
  return Math.round((b - a) / 86400000)
}

// "-u-nu-latn" pins Western (0-9) digits even for the mr-IN locale. Marathi
// readers of this app are just as used to standard digits (dates, phone
// numbers, currency), and mixing digit systems is an easy source of
// confusion for an elderly reader — so dates/times always use them,
// while month/weekday names still render in Marathi script.
const localeFor = (language: Language) => (language === 'mr' ? 'mr-IN-u-nu-latn' : 'en-IN')

/** Formats an ISO date string as a friendly Indian-style date, e.g. "21 Sep 2026". */
export function formatDateFriendly(dateIso: string, language: Language = 'en'): string {
  if (!dateIso) return ''
  const [y, m, d] = dateIso.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  return new Intl.DateTimeFormat(localeFor(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** Formats an ISO date string with a full month name, e.g. "21 September 2026". */
export function formatDateLong(dateIso: string, language: Language = 'en'): string {
  if (!dateIso) return ''
  const [y, m, d] = dateIso.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  return new Intl.DateTimeFormat(localeFor(language), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** Formats a 24-hour "HH:mm" time string as a locale-friendly 12-hour time, e.g. "8:00 AM". */
export function formatTimeFriendly(time: string, language: Language = 'en'): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(h ?? 0, m ?? 0, 0, 0)
  return new Intl.DateTimeFormat(localeFor(language), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/** Formats a full ISO-8601 timestamp (e.g. a `lastSyncedAt` value) as a
 * friendly local date + time, e.g. "21 Sep 2026, 6:41 PM". */
export function formatDateTimeFriendly(isoTimestamp: string, language: Language = 'en'): string {
  if (!isoTimestamp) return ''
  const date = new Date(isoTimestamp)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(localeFor(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function isToday(dateIso: string): boolean {
  return dateIso === todayIso()
}

export function isYesterday(dateIso: string): boolean {
  return dateIso === addDaysIso(todayIso(), -1)
}

/** Combines a date + time into a value that sorts chronologically as a string/number. */
export function toSortableTimestamp(date: string, time: string): number {
  return new Date(`${date}T${time || '00:00'}:00`).getTime()
}
