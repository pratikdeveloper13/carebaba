import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useSettings'
import { formatDateFriendly } from '../../utils/date'
import { daysUntilDue } from '../../services/vaccine/vaccineService'
import type { VaccineRecord } from '../../types/vaccine'

interface NextVaccineCardProps {
  vaccine?: VaccineRecord
}

/** Highlights the single most urgent upcoming (or overdue) vaccine on the
 * dashboard, with a clear text status — never color alone. */
export function NextVaccineCard({ vaccine }: NextVaccineCardProps) {
  const { t, language } = useTranslation()

  if (!vaccine) {
    return (
      <div className="rounded-3xl bg-vaccine-bg p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            💉
          </span>
          <p className="text-base font-bold text-vaccine">{t('dashboard.nextVaccine')}</p>
        </div>
        <p className="mt-2 text-base text-slate-600">{t('dashboard.noUpcomingVaccine')}</p>
        <Link
          to="/vaccines"
          className="mt-3 inline-block min-h-[44px] rounded-xl bg-vaccine px-4 py-2 text-sm font-bold text-white"
        >
          {t('vaccine.addTitle')}
        </Link>
      </div>
    )
  }

  const days = daysUntilDue(vaccine.dueDate)
  let dueText: string
  if (days === 0) dueText = t('vaccine.dueToday')
  else if (days === 1) dueText = t('vaccine.dueTomorrow')
  else if (days > 1) dueText = t('vaccine.dueIn', { days })
  else dueText = t('vaccine.overdueBy', { days: Math.abs(days) })

  return (
    <Link to="/vaccines" className="block rounded-3xl bg-vaccine-bg p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          💉
        </span>
        <p className="text-base font-bold text-vaccine">{t('dashboard.nextVaccine')}</p>
      </div>
      <p className="mt-2 text-xl font-extrabold text-slate-900">{vaccine.name}</p>
      <p className={`mt-1 text-base font-bold ${days < 0 ? 'text-warn' : 'text-vaccine'}`}>{dueText}</p>
      <p className="text-sm text-slate-500">{formatDateFriendly(vaccine.dueDate, language)}</p>
    </Link>
  )
}
