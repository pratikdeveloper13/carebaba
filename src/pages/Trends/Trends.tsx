import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TopBar } from '../../components/common/TopBar'
import { PageContainer } from '../../components/common/PageContainer'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ErrorBanner } from '../../components/common/ErrorBanner'
import { inputClass } from '../../components/common/FormField'
import { useTranslation } from '../../hooks/useSettings'
import {
  getSugarReadingsInRange,
  getBpReadingsInRange,
  getSpo2ReadingsInRange,
} from '../../services/health/healthService'
import { todayIso, addDaysIso, formatDateFriendly, formatTimeFriendly } from '../../utils/date'
import { sugarTypeLabelKeys } from '../../utils/labels'
import type { SugarReading, BloodPressureReading, Spo2Reading } from '../../types/health'
import type { TranslationKey } from '../../i18n'

type TrendType = 'sugar' | 'bp' | 'spo2'
type TrendRange = '7' | '30' | 'custom'

interface ChartPoint {
  label: string
  value?: number
  systolic?: number
  diastolic?: number
}

const typeOptions: { value: TrendType; icon: string; labelKey: TranslationKey }[] = [
  { value: 'sugar', icon: '🩸', labelKey: 'sugar.title' },
  { value: 'bp', icon: '❤️', labelKey: 'bp.title' },
  { value: 'spo2', icon: '🫁', labelKey: 'spo2.title' },
]

const rangeOptions: { value: TrendRange; labelKey: TranslationKey }[] = [
  { value: '7', labelKey: 'trends.range.7' },
  { value: '30', labelKey: 'trends.range.30' },
  { value: 'custom', labelKey: 'trends.range.custom' },
]

export function Trends() {
  const { t, language } = useTranslation()
  const [type, setType] = useState<TrendType>('sugar')
  const [range, setRange] = useState<TrendRange>('7')
  const [customFrom, setCustomFrom] = useState(addDaysIso(todayIso(), -6))
  const [customTo, setCustomTo] = useState(todayIso())

  const [sugar, setSugar] = useState<SugarReading[]>([])
  const [bp, setBp] = useState<BloodPressureReading[]>([])
  const [spo2, setSpo2] = useState<Spo2Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const today = todayIso()
  const from = range === '7' ? addDaysIso(today, -6) : range === '30' ? addDaysIso(today, -29) : customFrom
  const to = range === 'custom' ? customTo : today

  const load = () => {
    setLoading(true)
    setError(false)
    Promise.all([getSugarReadingsInRange(from, to), getBpReadingsInRange(from, to), getSpo2ReadingsInRange(from, to)])
      .then(([s, b, o]) => {
        setSugar([...s].reverse())
        setBp([...b].reverse())
        setSpo2([...o].reverse())
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [from, to])

  const chartData = useMemo((): ChartPoint[] => {
    if (type === 'sugar') {
      return sugar.map((r) => ({
        label: `${formatDateFriendly(r.date, language)} ${formatTimeFriendly(r.time, language)}`,
        value: r.value,
      }))
    }
    if (type === 'bp') {
      return bp.map((r) => ({
        label: `${formatDateFriendly(r.date, language)} ${formatTimeFriendly(r.time, language)}`,
        systolic: r.systolic,
        diastolic: r.diastolic,
      }))
    }
    return spo2.map((r) => ({
      label: `${formatDateFriendly(r.date, language)} ${formatTimeFriendly(r.time, language)}`,
      value: r.spo2,
    }))
  }, [type, sugar, bp, spo2, language])

  const hasData = chartData.length > 0

  return (
    <>
      <TopBar title={t('trends.title')} showBack />
      <PageContainer>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{t('trends.selectType')}</p>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  aria-pressed={type === opt.value}
                  className={`flex min-h-[44px] items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold ${
                    type === opt.value
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <span aria-hidden="true">{opt.icon}</span>
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{t('trends.selectRange')}</p>
            <div className="flex flex-wrap gap-2">
              {rangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRange(opt.value)}
                  aria-pressed={range === opt.value}
                  className={`min-h-[44px] rounded-full border-2 px-4 py-2 text-sm font-bold ${
                    range === opt.value
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
            {range === 'custom' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="trend-from" className="mb-1 block text-sm font-bold text-slate-700">
                    {t('history.from')}
                  </label>
                  <input
                    id="trend-from"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="trend-to" className="mb-1 block text-sm font-bold text-slate-700">
                    {t('history.to')}
                  </label>
                  <input
                    id="trend-to"
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {loading && <LoadingSpinner label={t('common.loading')} />}
          {!loading && error && (
            <ErrorBanner message={t('errors.loadFailed')} onRetry={load} retryLabel={t('common.retry')} />
          )}

          {!loading && !error && (
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="mb-3 text-lg font-bold text-slate-800">
                {type === 'sugar' ? t('trends.sugarChart') : type === 'bp' ? t('trends.bpChart') : t('trends.spo2Chart')}
              </p>
              {!hasData ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <span className="text-4xl" aria-hidden="true">
                    📈
                  </span>
                  <p className="text-base font-semibold text-slate-600">{t('trends.noData')}</p>
                  <p className="text-sm text-slate-500">{t('trends.noDataHint')}</p>
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" hide />
                      <YAxis tick={{ fontSize: 12 }} width={40} domain={['auto', 'auto']} />
                      <Tooltip />
                      {type === 'bp' ? (
                        <>
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="systolic"
                            name={t('bp.systolic')}
                            stroke="#db2777"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="diastolic"
                            name={t('bp.diastolic')}
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                        </>
                      ) : (
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={type === 'sugar' ? '#dc2626' : '#2563eb'}
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {!loading && !error && hasData && (
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="mb-2 text-base font-bold text-slate-800">{t('trends.recentValues')}</p>
              <div className="flex flex-col divide-y divide-slate-100">
                {type === 'sugar' &&
                  [...sugar].reverse().map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-500">
                        {formatDateFriendly(r.date, language)} · {formatTimeFriendly(r.time, language)} ·{' '}
                        {t(sugarTypeLabelKeys[r.readingType])}
                      </span>
                      <span className="font-bold text-slate-900">
                        {r.value} {t('sugar.unit')}
                      </span>
                    </div>
                  ))}
                {type === 'bp' &&
                  [...bp].reverse().map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-500">
                        {formatDateFriendly(r.date, language)} · {formatTimeFriendly(r.time, language)}
                      </span>
                      <span className="font-bold text-slate-900">
                        {r.systolic}/{r.diastolic} {t('bp.unit')}
                      </span>
                    </div>
                  ))}
                {type === 'spo2' &&
                  [...spo2].reverse().map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-500">
                        {formatDateFriendly(r.date, language)} · {formatTimeFriendly(r.time, language)}
                      </span>
                      <span className="font-bold text-slate-900">{r.spo2}%</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  )
}
