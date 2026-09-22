/**
 * Generic, typed data-access layer over IndexedDB.
 *
 * This is the ONLY module that talks to `db/indexedDb.ts` directly. Feature
 * services (`healthService`, `vaccineService`, `settingsService`) are built
 * on top of the functions here. Should the app later move to a remote
 * database/API, only this file needs to be swapped out — everything above
 * it (services, hooks, components) keeps working against the same
 * function signatures.
 */
import type { StoreNames, StoreValue } from 'idb'
import { getDb, STORE, type AppDB, type Tombstone } from '../../db/indexedDb'
import type { BackupData } from '../../types/backup'
import { BACKUP_VERSION } from '../../types/backup'
import type { AppSettings } from '../../types/settings'

export class StorageError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'StorageError'
    this.cause = cause
  }
}

async function withErrorHandling<T>(fn: () => Promise<T>, friendlyMessage: string): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    // Diagnostic only — never logs actual health values, just the failing operation.
    console.error(friendlyMessage, err)
    throw new StorageError(friendlyMessage, err)
  }
}

export async function getAllRecords<Name extends StoreNames<AppDB>>(
  storeName: Name,
): Promise<StoreValue<AppDB, Name>[]> {
  return withErrorHandling(async () => {
    const db = await getDb()
    return db.getAll(storeName)
  }, 'Could not load your saved data.')
}

export async function getRecord<Name extends StoreNames<AppDB>>(
  storeName: Name,
  id: string,
): Promise<StoreValue<AppDB, Name> | undefined> {
  return withErrorHandling(async () => {
    const db = await getDb()
    return db.get(storeName, id)
  }, 'Could not load this record.')
}

export async function putRecord<Name extends StoreNames<AppDB>>(
  storeName: Name,
  record: StoreValue<AppDB, Name>,
): Promise<void> {
  return withErrorHandling(async () => {
    const db = await getDb()
    await db.put(storeName, record)
  }, 'Could not save. Please try again.')
}

export async function deleteRecord<Name extends StoreNames<AppDB>>(
  storeName: Name,
  id: string,
): Promise<void> {
  return withErrorHandling(async () => {
    const db = await getDb()
    await db.delete(storeName, id)
  }, 'Could not delete this record.')
}

/**
 * Deletes a record AND leaves a tombstone behind. Used (instead of plain
 * `deleteRecord`) for every record type that participates in cross-device
 * sync — a tombstone is how another device learns "this was deleted" rather
 * than just "I've never heard of this id."
 */
export async function deleteRecordWithTombstone<Name extends StoreNames<AppDB>>(
  storeName: Name,
  id: string,
): Promise<void> {
  return withErrorHandling(async () => {
    const db = await getDb()
    const deletedAt = new Date().toISOString()
    await db.delete(storeName, id)
    await db.put(STORE.tombstones, {
      id: `${storeName}::${id}`,
      storeName,
      recordId: id,
      deletedAt,
    })
  }, 'Could not delete this record.')
}

export async function getAllTombstones(): Promise<Tombstone[]> {
  return getAllRecords(STORE.tombstones)
}

export async function putTombstone(tombstone: Tombstone): Promise<void> {
  return putRecord(STORE.tombstones, tombstone)
}

/** Deletes every record in a store, leaving a tombstone behind for each one
 * — required so "Clear All Data" can propagate as real deletions to other
 * synced devices instead of just hiding data locally (which cloud sync
 * would otherwise quietly restore on the next pull). */
async function clearStoreWithTombstones<Name extends StoreNames<AppDB>>(storeName: Name): Promise<void> {
  return withErrorHandling(async () => {
    const db = await getDb()
    const deletedAt = new Date().toISOString()
    const records = await db.getAll(storeName)
    for (const record of records) {
      const id = (record as { id: string }).id
      await db.delete(storeName, id)
      await db.put(STORE.tombstones, { id: `${storeName}::${id}`, storeName, recordId: id, deletedAt })
    }
  }, `Could not clear ${storeName}.`)
}

/** Deletes every health & vaccine record — for real, including propagating
 * the deletion to every other device sharing this data via cloud sync.
 * Language/display settings are intentionally preserved so the app doesn't
 * reset itself after a clear. */
export async function clearAllHealthData(): Promise<void> {
  await Promise.all([
    clearStoreWithTombstones(STORE.sugar),
    clearStoreWithTombstones(STORE.bp),
    clearStoreWithTombstones(STORE.spo2),
    clearStoreWithTombstones(STORE.vaccinations),
  ])
}

export async function exportAllData(settings?: AppSettings): Promise<BackupData> {
  const [sugarReadings, bpReadings, spo2Readings, vaccinations] = await Promise.all([
    getAllRecords(STORE.sugar),
    getAllRecords(STORE.bp),
    getAllRecords(STORE.spo2),
    getAllRecords(STORE.vaccinations),
  ])
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    sugarReadings,
    bpReadings,
    spo2Readings,
    vaccinations,
    settings,
  }
}

export function isBackupDataShape(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.version === 'number' &&
    Array.isArray(d.sugarReadings) &&
    Array.isArray(d.bpReadings) &&
    Array.isArray(d.spo2Readings) &&
    Array.isArray(d.vaccinations)
  )
}

/** Upgrades an older backup's shape to the current one. A no-op today since
 * version 1 is the only version ever shipped — kept as a clear seam so a
 * future version bump has an obvious place to add a `case` for old data. */
function migrateBackup(data: BackupData): BackupData {
  if (data.version === BACKUP_VERSION) return data
  if (data.version > BACKUP_VERSION) {
    throw new StorageError('This backup file was created by a newer version of the app.')
  }
  return { ...data, version: BACKUP_VERSION }
}

export interface ImportSummary {
  sugarCount: number
  bpCount: number
  spo2Count: number
  vaccineCount: number
}

/**
 * Restores a previously exported backup. Existing records with the same id
 * are overwritten (so importing the same file twice is always safe); every
 * other existing record is left untouched — nothing is silently deleted.
 */
export async function importAllData(raw: unknown): Promise<ImportSummary> {
  if (!isBackupDataShape(raw)) {
    throw new StorageError('This file is not a valid DAD Health Tracker backup.')
  }
  const data = migrateBackup(raw)

  return withErrorHandling(async () => {
    const db = await getDb()
    await Promise.all([
      ...data.sugarReadings.map((r) => db.put(STORE.sugar, r)),
      ...data.bpReadings.map((r) => db.put(STORE.bp, r)),
      ...data.spo2Readings.map((r) => db.put(STORE.spo2, r)),
      ...data.vaccinations.map((r) => db.put(STORE.vaccinations, r)),
    ])
    return {
      sugarCount: data.sugarReadings.length,
      bpCount: data.bpReadings.length,
      spo2Count: data.spo2Readings.length,
      vaccineCount: data.vaccinations.length,
    }
  }, 'Could not restore this backup.')
}

export { STORE }
