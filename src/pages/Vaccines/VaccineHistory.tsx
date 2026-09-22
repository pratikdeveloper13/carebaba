import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../../components/common/TopBar'
import { PageContainer } from '../../components/common/PageContainer'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ErrorBanner } from '../../components/common/ErrorBanner'
import { EmptyState } from '../../components/common/EmptyState'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { VaccineCard } from '../../components/vaccine/VaccineCard'
import { useTranslation } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { useSyncRefresh } from '../../hooks/useSyncRefresh'
import { getCompletedVaccines, deleteVaccine, reopenVaccine } from '../../services/vaccine/vaccineService'
import type { VaccineRecord } from '../../types/vaccine'

/** Completed vaccination history, with the ability to edit, delete, or move
 * a record back to "Upcoming" if it was marked complete by mistake. */
export function VaccineHistory() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [vaccines, setVaccines] = useState<VaccineRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<VaccineRecord | null>(null)

  const load = (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true)
      setError(false)
    }
    getCompletedVaccines()
      .then(setVaccines)
      .catch(() => {
        if (!opts?.silent) setError(true)
      })
      .finally(() => {
        if (!opts?.silent) setLoading(false)
      })
  }
  useEffect(() => load(), [])
  useSyncRefresh(() => load({ silent: true }))

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

  const handleReopen = async (vaccine: VaccineRecord) => {
    await reopenVaccine(vaccine)
    load()
  }

  return (
    <>
      <TopBar title={t('vaccine.history')} showBack />
      <PageContainer>
        {loading && <LoadingSpinner label={t('common.loading')} />}
        {!loading && error && (
          <ErrorBanner message={t('errors.loadFailed')} onRetry={load} retryLabel={t('common.retry')} />
        )}
        {!loading && !error && vaccines.length === 0 && (
          <EmptyState
            icon="💉"
            title={t('vaccine.empty.title')}
            actionLabel={t('vaccine.empty.action')}
            actionTo="/vaccines/add"
          />
        )}
        {!loading && !error && vaccines.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
              {t('vaccine.completedSection')}
            </p>
            {vaccines.map((v) => (
              <VaccineCard
                key={v.id}
                vaccine={v}
                onEdit={() => navigate(`/vaccines/edit/${v.id}`)}
                onDelete={() => setDeleteTarget(v)}
                onReopen={() => handleReopen(v)}
              />
            ))}
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
    </>
  )
}
