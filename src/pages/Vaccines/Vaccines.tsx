import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TopBar } from '../../components/common/TopBar'
import { PageContainer } from '../../components/common/PageContainer'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ErrorBanner } from '../../components/common/ErrorBanner'
import { EmptyState } from '../../components/common/EmptyState'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { VaccineCard } from '../../components/vaccine/VaccineCard'
import { CompleteVaccineDialog } from '../../components/vaccine/CompleteVaccineDialog'
import { useTranslation } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { getUpcomingVaccines, deleteVaccine } from '../../services/vaccine/vaccineService'
import type { VaccineRecord } from '../../types/vaccine'

/** Upcoming (and overdue) vaccines — the main Vaccination screen. */
export function Vaccines() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [vaccines, setVaccines] = useState<VaccineRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<VaccineRecord | null>(null)
  const [completeTarget, setCompleteTarget] = useState<VaccineRecord | null>(null)

  const load = () => {
    setLoading(true)
    setError(false)
    getUpcomingVaccines()
      .then(setVaccines)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteVaccine(deleteTarget.id)
      showToast(t('vaccine.deletedMessage'))
      setDeleteTarget(null)
      load()
    } catch {
      showToast(t('errors.deleteFailed'), 'error')
    }
  }

  return (
    <>
      <TopBar
        title={t('vaccine.title')}
        right={
          <Link to="/vaccines/history" className="text-sm font-bold text-brand-700">
            {t('vaccine.viewHistory')}
          </Link>
        }
      />
      <PageContainer>
        {loading && <LoadingSpinner label={t('common.loading')} />}
        {!loading && error && (
          <ErrorBanner message={t('errors.loadFailed')} onRetry={load} retryLabel={t('common.retry')} />
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-4">
            <Link
              to="/vaccines/add"
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-vaccine px-6 text-lg font-bold text-white shadow-sm"
            >
              💉 {t('vaccine.addTitle')}
            </Link>

            {vaccines.length === 0 ? (
              <EmptyState
                icon="💉"
                title={t('vaccine.empty.title')}
                actionLabel={t('vaccine.empty.action')}
                actionTo="/vaccines/add"
              />
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  {t('vaccine.upcomingSection')}
                </p>
                {vaccines.map((v) => (
                  <VaccineCard
                    key={v.id}
                    vaccine={v}
                    onEdit={() => navigate(`/vaccines/edit/${v.id}`)}
                    onDelete={() => setDeleteTarget(v)}
                    onMarkCompleted={() => setCompleteTarget(v)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </PageContainer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('history.deleteTitle')}
        message={t('vaccine.deleteConfirmMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {completeTarget && (
        <CompleteVaccineDialog
          vaccine={completeTarget}
          onCompleted={() => {
            showToast(t('vaccine.completedMessage'))
            setCompleteTarget(null)
            load()
          }}
          onCancel={() => setCompleteTarget(null)}
        />
      )}
    </>
  )
}
