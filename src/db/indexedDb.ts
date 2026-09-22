import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { SugarReading, BloodPressureReading, Spo2Reading } from '../types/health'
import type { VaccineRecord } from '../types/vaccine'
import type { AppSettings } from '../types/settings'

export const DB_NAME = 'dad-health-tracker'
export const DB_VERSION = 2

export const STORE = {
  sugar: 'sugarReadings',
  bp: 'bpReadings',
  spo2: 'spo2Readings',
  vaccinations: 'vaccinations',
  settings: 'settings',
  tombstones: 'tombstones',
} as const

/** A record of a deletion, kept so cross-device sync can propagate deletes
 * (a plain "record missing" can't be distinguished from "never synced
 * yet" without one). `id` is `${storeName}::${recordId}`. */
export interface Tombstone {
  id: string
  storeName: string
  recordId: string
  deletedAt: string
}

interface AppDB extends DBSchema {
  sugarReadings: {
    key: string
    value: SugarReading
    indexes: { 'by-date': string }
  }
  bpReadings: {
    key: string
    value: BloodPressureReading
    indexes: { 'by-date': string }
  }
  spo2Readings: {
    key: string
    value: Spo2Reading
    indexes: { 'by-date': string }
  }
  vaccinations: {
    key: string
    value: VaccineRecord
    indexes: { 'by-status': string; 'by-dueDate': string }
  }
  settings: {
    key: string
    value: AppSettings
  }
  tombstones: {
    key: string
    value: Tombstone
  }
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null

/** Lazily opens (and caches) the single shared IndexedDB connection,
 * creating object stores and indexes on first run / version bump. */
export function getDb(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE.sugar)) {
          const store = db.createObjectStore(STORE.sugar, { keyPath: 'id' })
          store.createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains(STORE.bp)) {
          const store = db.createObjectStore(STORE.bp, { keyPath: 'id' })
          store.createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains(STORE.spo2)) {
          const store = db.createObjectStore(STORE.spo2, { keyPath: 'id' })
          store.createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains(STORE.vaccinations)) {
          const store = db.createObjectStore(STORE.vaccinations, { keyPath: 'id' })
          store.createIndex('by-status', 'status')
          store.createIndex('by-dueDate', 'dueDate')
        }
        if (!db.objectStoreNames.contains(STORE.settings)) {
          db.createObjectStore(STORE.settings, { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains(STORE.tombstones)) {
          db.createObjectStore(STORE.tombstones, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export type { AppDB }
