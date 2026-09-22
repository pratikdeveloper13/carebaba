import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../../components/common/TopBar'
import { PageContainer } from '../../components/common/PageContainer'
import { Spo2Form } from '../../components/health/Spo2Form'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ErrorBanner } from '../../components/common/ErrorBanner'
import { useTranslation } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { getSpo2ReadingById } from '../../services/health/healthService'
import type { Spo2Reading } from '../../types/health'

export function AddSpo2() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [existing, setExisting] = useState<Spo2Reading | undefined>(undefined)
  const [loading, setLoading] = useState(Boolean(id))
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getSpo2ReadingById(id)
      .then((record) => {
        if (record) setExisting(record)
        else setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSaved = (_record: Spo2Reading, mode: 'added' | 'updated') => {
    showToast(mode === 'added' ? t('spo2.savedMessage') : t('spo2.updatedMessage'))
    navigate(id ? '/history' : '/')
  }

  return (
    <>
      <TopBar title={id ? t('spo2.editTitle') : t('spo2.addTitle')} showBack />
      <PageContainer>
        {loading && <LoadingSpinner label={t('common.loading')} />}
        {!loading && notFound && <ErrorBanner message={t('errors.loadFailed')} />}
        {!loading && !notFound && (
          <Spo2Form existing={existing} onSaved={handleSaved} onCancel={() => navigate(-1)} />
        )}
      </PageContainer>
    </>
  )
}
