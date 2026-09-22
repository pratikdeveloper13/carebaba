import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string | null
  required?: boolean
  hint?: string
  children: ReactNode
}

/** Labeled form field wrapper with a consistent large label and an
 * always-friendly (never technical) inline error message. */
export function FormField({ label, htmlFor, error, required, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-base font-bold text-slate-800">
        {label}
        {required && (
          <span className="text-red-600" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

/** Shared Tailwind classes for large, high-contrast text/number/date inputs. */
export const inputClass =
  'w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-4 text-lg text-slate-900 focus:border-brand-600 focus:outline-none'

export const inputClassError =
  'w-full rounded-2xl border-2 border-red-400 bg-red-50 px-4 py-4 text-lg text-slate-900 focus:border-red-600 focus:outline-none'
