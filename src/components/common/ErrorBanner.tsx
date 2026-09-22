interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  retryLabel?: string
}

/** Friendly, non-technical error message with an optional retry action.
 * Never shows a stack trace or raw error object to the user. */
export function ErrorBanner({ message, onRetry, retryLabel = 'Try again' }: ErrorBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-red-800">
      <p className="text-base font-semibold">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] shrink-0 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
