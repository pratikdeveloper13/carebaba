import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type ToastVariant = 'success' | 'error'

interface ToastState {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const AUTO_DISMISS_MS = 3200

/**
 * A large, high-contrast confirmation banner (e.g. "Sugar reading saved
 * successfully.") shown after every save/delete. Auto-dismisses, and is
 * announced to screen readers via aria-live.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ id: Date.now(), message, variant })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-8">
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border-2 px-5 py-4 shadow-lg ${
              toast.variant === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-red-300 bg-red-50 text-red-900'
            }`}
          >
            <span className="text-2xl" aria-hidden="true">
              {toast.variant === 'success' ? '✅' : '⚠️'}
            </span>
            <p className="text-lg font-semibold leading-snug">{toast.message}</p>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
