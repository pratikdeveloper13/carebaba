import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { TopBar } from '../../components/common/TopBar'
import { PageContainer } from '../../components/common/PageContainer'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { useSettings, useTranslation } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { useSyncStatus } from '../../hooks/useSyncStatus'
import { exportAllData, importAllData, clearAllHealthData, StorageError } from '../../services/storage/storageService'
import { syncNow, pushLocalStateToCloud } from '../../services/sync/cloudSyncService'
import { todayIso, formatDateTimeFriendly } from '../../utils/date'
import { APP_VERSION } from '../../utils/appInfo'

export function Settings() {
  const { t } = useTranslation()
  const {
    settings,
    language,
    setLanguage,
    largeText,
    setLargeText,
    colorIndicatorsEnabled,
    setColorIndicatorsEnabled,
  } = useSettings()
  const { showToast } = useToast()
  const syncStatus = useSyncStatus()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    try {
      const backup = await exportAllData(settings)
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dad-health-backup-${todayIso()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast(t('settings.exportSuccess'))
    } catch {
      showToast(t('errors.saveFailed'), 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleImportClick = () => {
    setImportError(null)
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file next time
    if (!file) return

    setImporting(true)
    setImportError(null)
    try {
      const text = await file.text()
      let parsed: unknown
      let invalidFile = false
      try {
        parsed = JSON.parse(text)
      } catch {
        invalidFile = true
      }
      if (invalidFile) {
        setImportError(t('settings.importErrorInvalid'))
        return
      }
      const summary = await importAllData(parsed)
      const total = summary.sugarCount + summary.bpCount + summary.spo2Count + summary.vaccineCount
      showToast(t('settings.importSuccess', { count: total }))
      void syncNow() // merge the just-imported records into the shared cloud copy
    } catch (err) {
      const message =
        err instanceof StorageError && err.message.includes('valid DAD')
          ? t('settings.importErrorInvalid')
          : t('settings.importErrorGeneric')
      setImportError(message)
    } finally {
      setImporting(false)
    }
  }

  const handleClearConfirmed = async () => {
    setClearing(true)
    try {
      await clearAllHealthData()
      showToast(t('settings.clearSuccess'))
      // Push-only (no pull-first): the clear must reach every synced
      // device as real deletions, not get silently undone by pulling the
      // old cloud copy back in.
      void pushLocalStateToCloud()
    } catch {
      showToast(t('errors.generic'), 'error')
    } finally {
      setClearing(false)
      setConfirmClearOpen(false)
    }
  }

  return (
    <>
      <TopBar title={t('settings.title')} />
      <PageContainer>
        <div className="flex flex-col gap-5">
          <Card>
            <p className="mb-3 text-lg font-bold text-slate-900">{t('settings.language')}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
                className={`min-h-[56px] rounded-2xl border-2 text-lg font-bold ${
                  language === 'en' ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-slate-700'
                }`}
              >
                {t('settings.languageEnglish')}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('mr')}
                aria-pressed={language === 'mr'}
                className={`min-h-[56px] rounded-2xl border-2 text-lg font-bold ${
                  language === 'mr' ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-slate-700'
                }`}
              >
                {t('settings.languageMarathi')}
              </button>
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-lg font-bold text-slate-900">{t('settings.display')}</p>
            <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 px-4 py-3">
              <span>
                <span className="block text-base font-bold text-slate-800">{t('settings.largeText')}</span>
                <span className="block text-sm text-slate-500">{t('settings.largeTextHint')}</span>
              </span>
              <input
                type="checkbox"
                checked={largeText}
                onChange={(e) => setLargeText(e.target.checked)}
                className="h-7 w-7 shrink-0 accent-brand-700"
                aria-label={t('settings.largeText')}
              />
            </label>

            <label className="mt-3 flex min-h-[56px] cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 px-4 py-3">
              <span>
                <span className="block text-base font-bold text-slate-800">{t('settings.colorIndicators')}</span>
                <span className="block text-sm text-slate-500">{t('settings.colorIndicatorsHint')}</span>
              </span>
              <input
                type="checkbox"
                checked={colorIndicatorsEnabled}
                onChange={(e) => setColorIndicatorsEnabled(e.target.checked)}
                className="h-7 w-7 shrink-0 accent-brand-700"
                aria-label={t('settings.colorIndicators')}
              />
            </label>
          </Card>

          <Card>
            <p className="mb-1 text-lg font-bold text-slate-900">{t('settings.sync')}</p>
            <p className="mb-4 text-sm text-slate-500">{t('settings.syncHint')}</p>

            <div
              className={`mb-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                syncStatus.state === 'error'
                  ? 'bg-warn-bg text-warn'
                  : syncStatus.state === 'offline'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-ok-bg text-ok'
              }`}
              role="status"
              aria-live="polite"
            >
              {syncStatus.state === 'syncing' && t('settings.syncStateSyncing')}
              {syncStatus.state === 'offline' && t('settings.syncStateOffline')}
              {syncStatus.state === 'error' && t('settings.syncStateError')}
              {syncStatus.state === 'idle' &&
                (syncStatus.lastSyncedAt
                  ? t('settings.syncLastSynced', { time: formatDateTimeFriendly(syncStatus.lastSyncedAt, language) })
                  : t('settings.syncNeverSynced'))}
            </div>

            <Button
              variant="secondary"
              fullWidth
              onClick={() => void syncNow()}
              disabled={syncStatus.state === 'syncing'}
            >
              🔄 {syncStatus.state === 'syncing' ? t('settings.syncStateSyncing') : t('settings.syncNow')}
            </Button>
            <p className="mt-2 px-1 text-sm text-slate-500">{t('settings.syncPrivacyNote')}</p>
          </Card>

          <Card>
            <p className="mb-1 text-lg font-bold text-slate-900">{t('settings.dataManagement')}</p>
            <p className="mb-4 text-sm text-slate-500">{t('app.storedLocally')}</p>

            <div className="flex flex-col gap-3">
              <div>
                <Button variant="secondary" fullWidth onClick={handleExport} disabled={exporting}>
                  ⬇️ {exporting ? t('common.saving') : t('settings.exportData')}
                </Button>
                <p className="mt-1 px-1 text-sm text-slate-500">{t('settings.exportHint')}</p>
              </div>

              <div>
                <Button variant="secondary" fullWidth onClick={handleImportClick} disabled={importing}>
                  ⬆️ {importing ? t('common.loading') : t('settings.importData')}
                </Button>
                <p className="mt-1 px-1 text-sm text-slate-500">{t('settings.importHint')}</p>
                {importError && <p className="mt-1 px-1 text-sm font-semibold text-red-700">{importError}</p>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </div>

              <div>
                <Button variant="danger" fullWidth onClick={() => setConfirmClearOpen(true)} disabled={clearing}>
                  🗑️ {t('settings.clearAllData')}
                </Button>
                <p className="mt-1 px-1 text-sm text-slate-500">{t('settings.clearHint')}</p>
              </div>
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-lg font-bold text-slate-900">{t('settings.about')}</p>
            <dl className="flex flex-col gap-2 text-base text-slate-700">
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('app.name')}</dt>
                <dd className="font-semibold">{t('app.name')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('settings.version')}</dt>
                <dd className="font-semibold">{APP_VERSION}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-slate-500">{t('settings.storageInfo')}</dt>
                <dd className="text-right font-semibold">{t('settings.storageInfoValue')}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
              {t('settings.privacyNote')}
            </p>
          </Card>
        </div>
      </PageContainer>

      <ConfirmDialog
        open={confirmClearOpen}
        title={t('settings.clearConfirmTitle')}
        message={t('settings.clearConfirmMessage')}
        confirmLabel={t('settings.clearAllData')}
        onConfirm={handleClearConfirmed}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </>
  )
}
