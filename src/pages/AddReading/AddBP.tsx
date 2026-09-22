import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../../components/common/TopBar'
import { PageContainer } from '../../components/common/PageContainer'
import { BPForm } from '../../components/health/BPForm'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ErrorBanner } from '../../components/common/ErrorBanner'
import { useTranslation } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { getBpReadingById } from '../../services/health/healthService'
import type { BloodPressureReading } from '../../types/health'

export function AddBP() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [existing, setExisting] = useState<BloodPressureReading | undefined>(undefined)
  const [loading, setLoading] = useState(Boolean(id))
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getBpReadingById(id)
      .then((record) => {
        if (record) setExisting(record)
        else setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSaved = (_record: BloodPressureReading, mode: 'added' | 'updated') => {
    showToast(mode === 'added' ? t('bp.savedMessage') : t('bp.updatedMessage'))
    navigate(id ? '/history' : '/')
  }

  return (
    <>
      <TopBar title={id ? t('bp.editTitle') : t('bp.addTitle')} showBack />
      <PageContainer>
        {loading && <LoadingSpinner label={t('common.loading')} />}
        {!loading && notFound && <ErrorBanner message={t('errors.loadFailed')} />}
        {!loading && !notFound && (
          <BPForm existing={existing} onSaved={handleSaved} onCancel={() => navigate(-1)} />
        )}
      </PageContainer>
    </>
  )
}
