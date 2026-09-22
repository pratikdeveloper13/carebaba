import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../../components/common/PageContainer'
import { LanguageSwitch } from '../../components/common/LanguageSwitch'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ErrorBanner } from '../../components/common/ErrorBanner'
import { ReadingSummaryCard } from '../../components/dashboard/ReadingSummaryCard'
import { NextVaccineCard } from '../../components/dashboard/NextVaccineCard'
import { useTranslation } from '../../hooks/useSettings'
import { useSyncRefresh } from '../../hooks/useSyncRefresh'
import { getTodaySnapshot } from '../../services/health/healthService'
import type { TodaySnapshot } from '../../services/health/healthService'
import { getNextVaccine } from '../../services/vaccine/vaccineService'
import type { VaccineRecord } from '../../types/vaccine'
import { formatDateLong, formatTimeFriendly } from '../../utils/date'
import { sugarTypeLabelKeys } from '../../utils/labels'
import type { TranslationKey } from '../../i18n'

function greetingKey(): TranslationKey {
  const hour = new Date().getHours()
  if (hour < 12) return 'greeting.morning'
  if (hour < 17) return 'greeting.afternoon'
  return 'greeting.evening'
}

export function Dashboard() {
  const { t, language } = useTranslation()
  const [snapshot, setSnapshot] = useState<TodaySnapshot | null>(null)
  const [nextVaccine, setNextVaccine] = useState<VaccineRecord | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // `silent` skips the loading spinner / error banner — used when a
  // background sync completes after the page has already rendered, so new
  // data from another device appears without a jarring re-flash.
  const load = (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true)
      setError(false)
    }
    Promise.all([getTodaySnapshot(), getNextVaccine()])
      .then(([s, v]) => {
        setSnapshot(s)
        setNextVaccine(v)
      })
      .catch(() => {
        if (!opts?.silent) setError(true)
      })
      .finally(() => {
        if (!opts?.silent) setLoading(false)
      })
  }

  useEffect(() => load(), [])
  useSyncRefresh(() => load({ silent: true }))

  return (
    <PageContainer>
      <div className="flex items-start justify-between gap-3 pb-2">
        <div>
          <p className="text-2xl font-extrabold text-slate-900">{t(greetingKey())}</p>
          <p className="text-base text-slate-500">{formatDateLong(new Date().toISOString().slice(0, 10), language)}</p>
        </div>
        <LanguageSwitch />
      </div>

      {loading && <LoadingSpinner label={t('common.loading')} />}
      {!loading && error && <ErrorBanner message={t('errors.loadFailed')} onRetry={load} retryLabel={t('common.retry')} />}

      {!loading && !error && snapshot && (
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-400">{t('dashboard.today')}</p>

          <ReadingSummaryCard
            icon="🩸"
            title={t('sugar.title')}
            valueText={snapshot.latestSugar ? `${snapshot.latestSugar.value} ${t('sugar.unit')}` : undefined}
            subText={
              snapshot.latestSugar
                ? `${t(sugarTypeLabelKeys[snapshot.latestSugar.readingType])} · ${formatTimeFriendly(snapshot.latestSugar.time, language)}`
                : undefined
            }
            countText={
              snapshot.todaySugarCount > 0
                ? t(snapshot.todaySugarCount === 1 ? 'dashboard.readingsTodayOne' : 'dashboard.readingsToday', {
                    count: snapshot.todaySugarCount,
                  })
                : undefined
            }
            emptyText={t('dashboard.noReadingToday')}
            addTo="/add/sugar"
            addLabel={`+ ${t('sugar.title')}`}
            accentClassName="bg-sugar-bg text-sugar"
          />

          <ReadingSummaryCard
            icon="❤️"
            title={t('bp.title')}
            valueText={
              snapshot.latestBp ? `${snapshot.latestBp.systolic}/${snapshot.latestBp.diastolic} ${t('bp.unit')}` : undefined
            }
            subText={
              snapshot.latestBp
                ? [
                    snapshot.latestBp.pulse ? `${t('bp.pulse')} ${snapshot.latestBp.pulse}` : null,
                    formatTimeFriendly(snapshot.latestBp.time, language),
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : undefined
            }
            countText={
              snapshot.todayBpCount > 0
                ? t(snapshot.todayBpCount === 1 ? 'dashboard.readingsTodayOne' : 'dashboard.readingsToday', {
                    count: snapshot.todayBpCount,
                  })
                : undefined
            }
            emptyText={t('dashboard.noReadingToday')}
            addTo="/add/bp"
            addLabel={`+ ${t('bp.title')}`}
            accentClassName="bg-bp-bg text-bp"
          />

          <ReadingSummaryCard
            icon="🫁"
            title={t('spo2.title')}
            valueText={snapshot.latestSpo2 ? `${snapshot.latestSpo2.spo2}%` : undefined}
            subText={
              snapshot.latestSpo2
                ? [
                    snapshot.latestSpo2.pulse ? `${t('spo2.pulse')} ${snapshot.latestSpo2.pulse}` : null,
                    formatTimeFriendly(snapshot.latestSpo2.time, language),
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : undefined
            }
            countText={
              snapshot.todaySpo2Count > 0
                ? t(snapshot.todaySpo2Count === 1 ? 'dashboard.readingsTodayOne' : 'dashboard.readingsToday', {
                    count: snapshot.todaySpo2Count,
                  })
                : undefined
            }
            emptyText={t('dashboard.noReadingToday')}
            addTo="/add/spo2"
            addLabel={`+ ${t('spo2.title')}`}
            accentClassName="bg-spo2-bg text-spo2"
          />

          <NextVaccineCard vaccine={nextVaccine} />

          <Link
            to="/add"
            className="mt-2 flex min-h-[64px] items-center justify-center rounded-3xl bg-brand-700 px-6 text-xl font-extrabold text-white shadow-sm active:bg-brand-800"
          >
            {t('dashboard.addReading')}
          </Link>

          <p className="mt-1 rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-500">
            {t('dashboard.disclaimer')}
          </p>
        </div>
      )}
    </PageContainer>
  )
}
