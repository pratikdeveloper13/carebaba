/**
 * Business logic for the three health-reading types (Sugar, BP, SpO2).
 * UI code should only ever call functions from this file (or the hooks
 * built on top of it) — never `storageService` or `db/indexedDb` directly.
 */
import {
  STORE,
  getAllRecords,
  getRecord,
  putRecord,
  deleteRecordWithTombstone,
} from '../storage/storageService'
import { generateId } from '../../utils/id'
import { todayIso, toSortableTimestamp } from '../../utils/date'
import { scheduleCloudPush } from '../sync/cloudSyncService'
import type {
  SugarReading,
  NewSugarReading,
  BloodPressureReading,
  NewBloodPressureReading,
  Spo2Reading,
  NewSpo2Reading,
} from '../../types/health'

function sortNewestFirst<T extends { date: string; time: string }>(records: T[]): T[] {
  return [...records].sort(
    (a, b) => toSortableTimestamp(b.date, b.time) - toSortableTimestamp(a.date, a.time),
  )
}

function inRange(dateIso: string, fromIso?: string, toIso?: string): boolean {
  if (fromIso && dateIso < fromIso) return false
  if (toIso && dateIso > toIso) return false
  return true
}

// ---------------------------------------------------------------------------
// Sugar
// ---------------------------------------------------------------------------

export async function getAllSugarReadings(): Promise<SugarReading[]> {
  const records = await getAllRecords(STORE.sugar)
  return sortNewestFirst(records)
}

export async function getSugarReadingsInRange(fromIso?: string, toIso?: string) {
  const all = await getAllSugarReadings()
  return all.filter((r) => inRange(r.date, fromIso, toIso))
}

export async function addSugarReading(input: NewSugarReading): Promise<SugarReading> {
  const now = new Date().toISOString()
  const record: SugarReading = { ...input, id: generateId(), createdAt: now, updatedAt: now }
  await putRecord(STORE.sugar, record)
  scheduleCloudPush()
  return record
}

export async function updateSugarReading(
  id: string,
  updates: Partial<NewSugarReading>,
  existing: SugarReading,
): Promise<SugarReading> {
  const record: SugarReading = { ...existing, ...updates, id, updatedAt: new Date().toISOString() }
  await putRecord(STORE.sugar, record)
  scheduleCloudPush()
  return record
}

export async function deleteSugarReading(id: string): Promise<void> {
  await deleteRecordWithTombstone(STORE.sugar, id)
  scheduleCloudPush()
}

export async function getSugarReadingById(id: string): Promise<SugarReading | undefined> {
  return getRecord(STORE.sugar, id)
}

// ---------------------------------------------------------------------------
// Blood Pressure
// ---------------------------------------------------------------------------

export async function getAllBpReadings(): Promise<BloodPressureReading[]> {
  const records = await getAllRecords(STORE.bp)
  return sortNewestFirst(records)
}

export async function getBpReadingsInRange(fromIso?: string, toIso?: string) {
  const all = await getAllBpReadings()
  return all.filter((r) => inRange(r.date, fromIso, toIso))
}

export async function addBpReading(input: NewBloodPressureReading): Promise<BloodPressureReading> {
  const now = new Date().toISOString()
  const record: BloodPressureReading = { ...input, id: generateId(), createdAt: now, updatedAt: now }
  await putRecord(STORE.bp, record)
  scheduleCloudPush()
  return record
}

export async function updateBpReading(
  id: string,
  updates: Partial<NewBloodPressureReading>,
  existing: BloodPressureReading,
): Promise<BloodPressureReading> {
  const record: BloodPressureReading = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  }
  await putRecord(STORE.bp, record)
  scheduleCloudPush()
  return record
}

export async function deleteBpReading(id: string): Promise<void> {
  await deleteRecordWithTombstone(STORE.bp, id)
  scheduleCloudPush()
}

export async function getBpReadingById(id: string): Promise<BloodPressureReading | undefined> {
  return getRecord(STORE.bp, id)
}

// ---------------------------------------------------------------------------
// SpO2
// ---------------------------------------------------------------------------

export async function getAllSpo2Readings(): Promise<Spo2Reading[]> {
  const records = await getAllRecords(STORE.spo2)
  return sortNewestFirst(records)
}

export async function getSpo2ReadingsInRange(fromIso?: string, toIso?: string) {
  const all = await getAllSpo2Readings()
  return all.filter((r) => inRange(r.date, fromIso, toIso))
}

export async function addSpo2Reading(input: NewSpo2Reading): Promise<Spo2Reading> {
  const now = new Date().toISOString()
  const record: Spo2Reading = { ...input, id: generateId(), createdAt: now, updatedAt: now }
  await putRecord(STORE.spo2, record)
  scheduleCloudPush()
  return record
}

export async function updateSpo2Reading(
  id: string,
  updates: Partial<NewSpo2Reading>,
  existing: Spo2Reading,
): Promise<Spo2Reading> {
  const record: Spo2Reading = { ...existing, ...updates, id, updatedAt: new Date().toISOString() }
  await putRecord(STORE.spo2, record)
  scheduleCloudPush()
  return record
}

export async function deleteSpo2Reading(id: string): Promise<void> {
  await deleteRecordWithTombstone(STORE.spo2, id)
  scheduleCloudPush()
}

export async function getSpo2ReadingById(id: string): Promise<Spo2Reading | undefined> {
  return getRecord(STORE.spo2, id)
}

// ---------------------------------------------------------------------------
// Dashboard aggregates
// ---------------------------------------------------------------------------

export interface TodaySnapshot {
  latestSugar?: SugarReading
  todaySugarCount: number
  latestBp?: BloodPressureReading
  todayBpCount: number
  latestSpo2?: Spo2Reading
  todaySpo2Count: number
}

export async function getTodaySnapshot(): Promise<TodaySnapshot> {
  const today = todayIso()
  const [sugar, bp, spo2] = await Promise.all([
    getAllSugarReadings(),
    getAllBpReadings(),
    getAllSpo2Readings(),
  ])
  const todaySugar = sugar.filter((r) => r.date === today)
  const todayBp = bp.filter((r) => r.date === today)
  const todaySpo2 = spo2.filter((r) => r.date === today)
  return {
    latestSugar: todaySugar[0] ?? sugar[0],
    todaySugarCount: todaySugar.length,
    latestBp: todayBp[0] ?? bp[0],
    todayBpCount: todayBp.length,
    latestSpo2: todaySpo2[0] ?? spo2[0],
    todaySpo2Count: todaySpo2.length,
  }
}
