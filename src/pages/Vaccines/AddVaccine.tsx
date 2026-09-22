import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../../components/common/TopBar'
import { PageContainer } from '../../components/common/PageContainer'
import { VaccineForm } from '../../components/vaccine/VaccineForm'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ErrorBanner } from '../../components/common/ErrorBanner'
import { useTranslation } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { getVaccineById } from '../../services/vaccine/vaccineService'
import type { VaccineRecord } from '../../types/vaccine'

export function AddVaccine() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [existing, setExisting] = useState<VaccineRecord | undefined>(undefined)
  const [loading, setLoading] = useState(Boolean(id))
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getVaccineById(id)
      .then((record) => {
        if (record) setExisting(record)
        else setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSaved = (_record: VaccineRecord, mode: 'added' | 'updated') => {
    showToast(mode === 'added' ? t('vaccine.savedMessage') : t('vaccine.updatedMessage'))
    navigate('/vaccines')
  }

  return (
    <>
      <TopBar title={id ? t('vaccine.editTitle') : t('vaccine.addTitle')} showBack />
      <PageContainer>
        {loading && <LoadingSpinner label={t('common.loading')} />}
        {!loading && notFound && <ErrorBanner message={t('errors.loadFailed')} />}
        {!loading && !notFound && (
          <VaccineForm existing={existing} onSaved={handleSaved} onCancel={() => navigate(-1)} />
        )}
      </PageContainer>
    </>
  )
}
