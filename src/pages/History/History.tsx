import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TopBar } from '../../components/common/TopBar'
import { PageContainer } from '../../components/common/PageContainer'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ErrorBanner } from '../../components/common/ErrorBanner'
import { EmptyState } from '../../components/common/EmptyState'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { HistoryFilters } from '../../components/history/HistoryFilters'
import type { HistoryRange, HistoryTypeFilter } from '../../components/history/HistoryFilters'
import { HistoryItemRow } from '../../components/history/HistoryItemRow'
import type { HistoryEntry } from '../../components/history/HistoryItemRow'
import { useSettings, useTranslation } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { useSyncRefresh } from '../../hooks/useSyncRefresh'
import {
  getSugarReadingsInRange,
  deleteSugarReading,
  getBpReadingsInRange,
  deleteBpReading,
  getSpo2ReadingsInRange,
  deleteSpo2Reading,
} from '../../services/health/healthService'
import { todayIso, addDaysIso, formatDateLong } from '../../utils/date'

function rangeToDates(range: HistoryRange, customFrom: string, customTo: string): { from: string; to: string } {
  const today = todayIso()
  switch (range) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday': {
      const yesterday = addDaysIso(today, -1)
      return { from: yesterday, to: yesterday }
    }
    case 'last7':
      return { from: addDaysIso(today, -6), to: today }
    case 'last30':
      return { from: addDaysIso(today, -29), to: today }
    case 'custom':
      return { from: customFrom, to: customTo }
  }
}

function groupByDate(entries: HistoryEntry[]): { date: string; entries: HistoryEntry[] }[] {
  const map = new Map<string, HistoryEntry[]>()
  for (const entry of entries) {
    const list = map.get(entry.record.date) ?? []
    list.push(entry)
    map.set(entry.record.date, list)
  }
  return Array.from(map.keys())
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({
      date,
      entries: [...map.get(date)!].sort((a, b) => a.record.time.localeCompare(b.record.time)),
    }))
}

export function History() {
  const { t, language } = useTranslation()
  const { colorIndicatorsEnabled } = useSettings()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [range, setRange] = useState<HistoryRange>('last7')
  const [typeFilter, setTypeFilter] = useState<HistoryTypeFilter>('all')
  const [customFrom, setCustomFrom] = useState(todayIso())
  const [customTo, setCustomTo] = useState(todayIso())

  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<HistoryEntry | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { from, to } = rangeToDates(range, customFrom, customTo)

  const load = (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true)
      setError(false)
    }
    Promise.all([
      typeFilter === 'all' || typeFilter === 'sugar' ? getSugarReadingsInRange(from, to) : Promise.resolve([]),
      typeFilter === 'all' || typeFilter === 'bp' ? getBpReadingsInRange(from, to) : Promise.resolve([]),
      typeFilter === 'all' || typeFilter === 'spo2' ? getSpo2ReadingsInRange(from, to) : Promise.resolve([]),
    ])
      .then(([sugar, bp, spo2]) => {
        const merged: HistoryEntry[] = [
          ...sugar.map((record) => ({ kind: 'sugar' as const, record })),
          ...bp.map((record) => ({ kind: 'bp' as const, record })),
          ...spo2.map((record) => ({ kind: 'spo2' as const, record })),
        ]
        setEntries(merged)
      })
      .catch(() => {
        if (!opts?.silent) setError(true)
      })
      .finally(() => {
        if (!opts?.silent) setLoading(false)
      })
  }

  useEffect(load, [range, typeFilter, from, to])
  useSyncRefresh(() => load({ silent: true }))

  const grouped = useMemo(() => groupByDate(entries), [entries])

  const deleteMessageKey = deleteTarget
    ? ({ sugar: 'sugar.deleteConfirmMessage', bp: 'bp.deleteConfirmMessage', spo2: 'spo2.deleteConfirmMessage' } as const)[
        deleteTarget.kind
      ]
    : null

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.kind === 'sugar') await deleteSugarReading(deleteTarget.record.id)
      else if (deleteTarget.kind === 'bp') await deleteBpReading(deleteTarget.record.id)
      else await deleteSpo2Reading(deleteTarget.record.id)

      const deletedMessageKey = (
        { sugar: 'sugar.deletedMessage', bp: 'bp.deletedMessage', spo2: 'spo2.deletedMessage' } as const
      )[deleteTarget.kind]
      showToast(t(deletedMessageKey))
      setDeleteTarget(null)
      load()
    } catch {
      showToast(t('errors.deleteFailed'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <TopBar
        title={t('history.title')}
        right={
          <Link to="/trends" className="flex items-center gap-1 text-sm font-bold text-brand-700">
            📈 {t('trends.title')}
          </Link>
        }
      />
      <PageContainer>
        <HistoryFilters
          range={range}
          onRangeChange={setRange}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />

        <div className="mt-5 flex flex-col gap-5">
          {loading && <LoadingSpinner label={t('common.loading')} />}
          {!loading && error && (
            <ErrorBanner message={t('errors.loadFailed')} onRetry={load} retryLabel={t('common.retry')} />
          )}
          {!loading && !error && grouped.length === 0 && (
            <EmptyState icon="📋" title={t('history.empty.title')} subtitle={t('history.empty.subtitle')} />
          )}
          {!loading &&
            !error &&
            grouped.map((group) => (
              <div key={group.date}>
                <p className="mb-2 text-base font-bold text-slate-700">{formatDateLong(group.date, language)}</p>
                <div className="flex flex-col gap-2">
                  {group.entries.map((entry) => (
                    <HistoryItemRow
                      key={`${entry.kind}-${entry.record.id}`}
                      entry={entry}
                      onEdit={() => navigate(`/edit/${entry.kind}/${entry.record.id}`)}
                      onDelete={() => setDeleteTarget(entry)}
                    />
                  ))}
                </div>
              </div>
            ))}
          {!loading && !error && grouped.length > 0 && colorIndicatorsEnabled && (
            <p className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-500">
              {t('status.disclaimer')}
            </p>
          )}
        </div>
      </PageContainer>

      <ConfirmDialog
        open={Boolean(deleteTarget) && !deleting}
        title={t('history.deleteTitle')}
        message={deleteMessageKey ? t(deleteMessageKey) : ''}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
