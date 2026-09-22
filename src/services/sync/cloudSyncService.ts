/**
 * Cross-device sync.
 *
 * All health/vaccine data lives in IndexedDB first (instant, offline-safe —
 * every read in the app still goes through `healthService`/`vaccineService`
 * exactly as before). This module additionally mirrors that data to a
 * shared cloud copy (a Netlify Function backed by Netlify Blobs, see
 * `netlify/functions/household.mts`) so every device pointed at the same
 * deployed site converges on the same data over time.
 *
 * Sync is deliberately "best effort": if the network or the function is
 * unavailable (offline, local `vite dev` without `netlify dev`, etc.) every
 * function here fails silently and the app keeps working purely locally —
 * cloud sync is a bonus layer, never a requirement.
 *
 * Merge rule: last-write-wins by `updatedAt`, plus tombstones so deletes
 * propagate across devices instead of silently reappearing.
 */
import {
  STORE,
  getAllRecords,
  putRecord,
  deleteRecord,
  getAllTombstones,
  putTombstone,
} from '../storage/storageService'
import type { Tombstone } from '../../db/indexedDb'
import type { SugarReading, BloodPressureReading, Spo2Reading } from '../../types/health'
import type { VaccineRecord } from '../../types/vaccine'

const ENDPOINT = '/api/household'
const SYNC_VERSION = 1
const PUSH_DEBOUNCE_MS = 1500

interface HouseholdPayload {
  version: number
  updatedAt: string
  sugarReadings: SugarReading[]
  bpReadings: BloodPressureReading[]
  spo2Readings: Spo2Reading[]
  vaccinations: VaccineRecord[]
  tombstones: Tombstone[]
}

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error'

export interface SyncStatus {
  state: SyncState
  lastSyncedAt: string | null
}

let status: SyncStatus = { state: 'idle', lastSyncedAt: null }
const listeners = new Set<(status: SyncStatus) => void>()

function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next }
  listeners.forEach((listener) => listener(status))
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

type RecordWithMeta = { id: string; updatedAt: string }
type StoreKey = typeof STORE.sugar | typeof STORE.bp | typeof STORE.spo2 | typeof STORE.vaccinations

/** Pure decision function (no I/O, so it stays simply typed): given a
 * store's local + remote records and the tombstone map, returns exactly
 * the remote records that should overwrite/be added locally — newer by
 * `updatedAt`, and not superseded by a newer tombstone. */
function pickRemoteWinners<T extends RecordWithMeta>(
  storeName: StoreKey,
  localRecords: T[],
  remoteRecords: T[],
  tombstoneMap: Map<string, string>,
): T[] {
  const localById = new Map(localRecords.map((r) => [r.id, r]))
  const winners: T[] = []
  for (const remote of remoteRecords) {
    const tombstoneDeletedAt = tombstoneMap.get(`${storeName}::${remote.id}`)
    if (tombstoneDeletedAt && tombstoneDeletedAt >= remote.updatedAt) continue // deleted elsewhere, after this copy

    const local = localById.get(remote.id)
    if (!local || local.updatedAt < remote.updatedAt) winners.push(remote)
  }
  return winners
}

/** Deletes any local record that a tombstone says was removed elsewhere,
 * as long as the local copy isn't itself a newer, unsynced edit. */
async function applyTombstonesForStore<T extends RecordWithMeta>(
  storeName: StoreKey,
  localRecords: T[],
  tombstones: Tombstone[],
) {
  const localById = new Map(localRecords.map((r) => [r.id, r]))
  for (const tombstone of tombstones) {
    if (tombstone.storeName !== storeName) continue
    const local = localById.get(tombstone.recordId)
    if (local && local.updatedAt <= tombstone.deletedAt) {
      await deleteRecord(storeName, tombstone.recordId)
    }
  }
}

async function mergeRemoteIntoLocal(remote: HouseholdPayload) {
  const [localSugar, localBp, localSpo2, localVaccinations, localTombstones] = await Promise.all([
    getAllRecords(STORE.sugar),
    getAllRecords(STORE.bp),
    getAllRecords(STORE.spo2),
    getAllRecords(STORE.vaccinations),
    getAllTombstones(),
  ])

  // Union of local + remote tombstones (newest deletedAt wins per key).
  // Local tombstones MUST be included here, not just remote ones — without
  // this, a record deleted locally moments ago (tombstone not pushed yet)
  // would look "missing locally" to pickRemoteWinners and get resurrected
  // by the very same sync pass that's supposed to be propagating its delete.
  const tombstoneMap = new Map<string, string>()
  for (const t of [...remote.tombstones, ...localTombstones]) {
    const existing = tombstoneMap.get(t.id)
    if (!existing || existing < t.deletedAt) tombstoneMap.set(t.id, t.deletedAt)
  }

  for (const r of pickRemoteWinners(STORE.sugar, localSugar, remote.sugarReadings, tombstoneMap)) {
    await putRecord(STORE.sugar, r)
  }
  for (const r of pickRemoteWinners(STORE.bp, localBp, remote.bpReadings, tombstoneMap)) {
    await putRecord(STORE.bp, r)
  }
  for (const r of pickRemoteWinners(STORE.spo2, localSpo2, remote.spo2Readings, tombstoneMap)) {
    await putRecord(STORE.spo2, r)
  }
  for (const r of pickRemoteWinners(STORE.vaccinations, localVaccinations, remote.vaccinations, tombstoneMap)) {
    await putRecord(STORE.vaccinations, r)
  }

  await applyTombstonesForStore(STORE.sugar, localSugar, remote.tombstones)
  await applyTombstonesForStore(STORE.bp, localBp, remote.tombstones)
  await applyTombstonesForStore(STORE.spo2, localSpo2, remote.tombstones)
  await applyTombstonesForStore(STORE.vaccinations, localVaccinations, remote.tombstones)

  // Learn about tombstones we didn't have locally yet (so we don't
  // re-upload records that were already deleted on another device before
  // we ever saw them).
  const localTombstoneIds = new Set(localTombstones.map((t) => t.id))
  for (const tombstone of remote.tombstones) {
    if (!localTombstoneIds.has(tombstone.id)) await putTombstone(tombstone)
  }
}

async function buildLocalSnapshot(): Promise<HouseholdPayload> {
  const [sugarReadings, bpReadings, spo2Readings, vaccinations, tombstones] = await Promise.all([
    getAllRecords(STORE.sugar),
    getAllRecords(STORE.bp),
    getAllRecords(STORE.spo2),
    getAllRecords(STORE.vaccinations),
    getAllTombstones(),
  ])
  return {
    version: SYNC_VERSION,
    updatedAt: new Date().toISOString(),
    sugarReadings,
    bpReadings,
    spo2Readings,
    vaccinations,
    tombstones,
  }
}

async function fetchRemote(): Promise<HouseholdPayload | null> {
  const response = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`sync GET failed: ${response.status}`)
  return (await response.json()) as HouseholdPayload
}

async function pushRemote(payload: HouseholdPayload): Promise<void> {
  const response = await fetch(ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`sync PUT failed: ${response.status}`)
}

/** Pulls the shared cloud copy in, merges it locally, then pushes the
 * resulting (now-merged) local state back up — so after this call, both
 * this device and the cloud hold the union of everything known so far. */
export async function syncNow(): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setStatus({ state: 'offline' })
    return
  }
  setStatus({ state: 'syncing' })
  try {
    const remote = await fetchRemote()
    if (remote) await mergeRemoteIntoLocal(remote)
    const snapshot = await buildLocalSnapshot()
    await pushRemote(snapshot)
    setStatus({ state: 'idle', lastSyncedAt: new Date().toISOString() })
  } catch {
    // No backend deployed, offline, or a transient error — sync is a bonus
    // layer, so we degrade quietly and the app keeps working locally.
    setStatus({ state: 'error' })
  }
}

/**
 * Pushes the current local state to the cloud WITHOUT pulling first —
 * i.e. "the cloud must now match exactly what I have," even if that means
 * fewer records than before. Use this only right after an action that is
 * meant to be destructive and final (e.g. "Clear All Data"); regular sync
 * should always use `syncNow`, which merges instead of overwriting.
 */
export async function pushLocalStateToCloud(): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setStatus({ state: 'offline' })
    return
  }
  setStatus({ state: 'syncing' })
  try {
    const snapshot = await buildLocalSnapshot()
    await pushRemote(snapshot)
    setStatus({ state: 'idle', lastSyncedAt: new Date().toISOString() })
  } catch {
    setStatus({ state: 'error' })
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null

/** Call after any local add/update/delete. Debounced so a burst of edits
 * (e.g. filling out a form) results in one sync, not one per keystroke. */
export function scheduleCloudPush(): void {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    void syncNow()
  }, PUSH_DEBOUNCE_MS)
}

let initialized = false

/** Wires up automatic syncing: once on startup, whenever the browser comes
 * back online, and whenever the tab regains focus/visibility (covers
 * "switched back to the app after a while" without needing to poll). */
export function initCloudSync(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  void syncNow()
  window.addEventListener('online', () => void syncNow())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow()
  })
}
