import { useTranslation } from '../../hooks/useSettings'
import { formatDateFriendly, formatTimeFriendly } from '../../utils/date'
import { daysUntilDue } from '../../services/vaccine/vaccineService'
import { vaccineStatusLabelKeys as statusLabelKeys } from '../../utils/labels'
import type { VaccineRecord, VaccineStatus } from '../../types/vaccine'

interface VaccineCardProps {
  vaccine: VaccineRecord
  onEdit?: () => void
  onDelete?: () => void
  onMarkCompleted?: () => void
  onReopen?: () => void
}

const statusStyles: Record<VaccineStatus, string> = {
  upcoming: 'bg-vaccine-bg text-vaccine',
  missed: 'bg-warn-bg text-warn',
  completed: 'bg-ok-bg text-ok',
}

/** A single vaccine's card: name, dose, due/overdue indicator (never only
 * color-coded — always paired with text), and its available actions. */
export function VaccineCard({ vaccine, onEdit, onDelete, onMarkCompleted, onReopen }: VaccineCardProps) {
  const { t, language } = useTranslation()
  const days = daysUntilDue(vaccine.dueDate)

  let dueText = ''
  if (vaccine.status !== 'completed') {
    if (days === 0) dueText = t('vaccine.dueToday')
    else if (days === 1) dueText = t('vaccine.dueTomorrow')
    else if (days > 1) dueText = t('vaccine.dueIn', { days })
    else dueText = t('vaccine.overdueBy', { days: Math.abs(days) })
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">
            💉
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900">{vaccine.name}</p>
            {vaccine.doseNumber && (
              <p className="text-sm text-slate-500">
                {vaccine.totalDoses
                  ? t('vaccine.doseOf', { dose: vaccine.doseNumber, total: vaccine.totalDoses })
                  : t('vaccine.dose', { dose: vaccine.doseNumber })}
              </p>
            )}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusStyles[vaccine.status]}`}>
          {t(statusLabelKeys[vaccine.status])}
        </span>
      </div>

      <div className="mt-3 text-base text-slate-700">
        {vaccine.status === 'completed' && vaccine.completedDate ? (
          <p>
            {formatDateFriendly(vaccine.completedDate, language)}
            {vaccine.completedTime ? ` · ${formatTimeFriendly(vaccine.completedTime, language)}` : ''}
          </p>
        ) : (
          <>
            <p>
              {t('vaccine.dueDate')}: {formatDateFriendly(vaccine.dueDate, language)}
              {vaccine.dueTime ? ` · ${formatTimeFriendly(vaccine.dueTime, language)}` : ''}
            </p>
            {dueText && (
              <p className={`mt-1 font-bold ${vaccine.status === 'missed' ? 'text-warn' : 'text-vaccine'}`}>
                {dueText}
              </p>
            )}
          </>
        )}
        {vaccine.doctorOrHospital && <p className="mt-1 text-sm text-slate-500">{vaccine.doctorOrHospital}</p>}
        {vaccine.notes && <p className="mt-1 text-sm italic text-slate-500">{vaccine.notes}</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {onMarkCompleted && (
          <button
            type="button"
            onClick={onMarkCompleted}
            className="min-h-[44px] rounded-xl bg-ok px-4 py-2 text-sm font-bold text-white"
          >
            {t('vaccine.markCompleted')}
          </button>
        )}
        {onReopen && (
          <button
            type="button"
            onClick={onReopen}
            className="min-h-[44px] rounded-xl border-2 border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
          >
            {t('vaccine.reopen')}
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="min-h-[44px] rounded-xl border-2 border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
          >
            {t('common.edit')}
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="min-h-[44px] rounded-xl border-2 border-red-300 px-4 py-2 text-sm font-bold text-red-700"
          >
            {t('common.delete')}
          </button>
        )}
      </div>
    </div>
  )
}
