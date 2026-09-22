import { Button } from './Button'
import { useTranslation } from '../../hooks/useSettings'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

/** A strong, unmissable confirmation prompt used before any destructive
 * action (deleting a reading, clearing all data). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-xl font-bold text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-slate-600">{message}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} fullWidth>
            {confirmLabel ?? t('common.delete')}
          </Button>
          <Button variant="secondary" onClick={onCancel} fullWidth>
            {cancelLabel ?? t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  )
}
