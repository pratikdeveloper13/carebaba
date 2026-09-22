import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../../components/common/TopBar'
import { PageContainer } from '../../components/common/PageContainer'
import { SugarForm } from '../../components/health/SugarForm'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ErrorBanner } from '../../components/common/ErrorBanner'
import { useTranslation } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { getSugarReadingById } from '../../services/health/healthService'
import type { SugarReading } from '../../types/health'

export function AddSugar() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [existing, setExisting] = useState<SugarReading | undefined>(undefined)
  const [loading, setLoading] = useState(Boolean(id))
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getSugarReadingById(id)
      .then((record) => {
        if (record) setExisting(record)
        else setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSaved = (_record: SugarReading, mode: 'added' | 'updated') => {
    showToast(mode === 'added' ? t('sugar.savedMessage') : t('sugar.updatedMessage'))
    navigate(id ? '/history' : '/')
  }

  return (
    <>
      <TopBar title={id ? t('sugar.editTitle') : t('sugar.addTitle')} showBack />
      <PageContainer>
        {loading && <LoadingSpinner label={t('common.loading')} />}
        {!loading && notFound && <ErrorBanner message={t('errors.loadFailed')} />}
        {!loading && !notFound && (
          <SugarForm existing={existing} onSaved={handleSaved} onCancel={() => navigate(-1)} />
        )}
      </PageContainer>
    </>
  )
}
