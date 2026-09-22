/** Business logic for vaccine schedule & history. */
import {
  STORE,
  getAllRecords,
  getRecord,
  putRecord,
  deleteRecordWithTombstone,
} from '../storage/storageService'
import { generateId } from '../../utils/id'
import { todayIso } from '../../utils/date'
import { scheduleCloudPush } from '../sync/cloudSyncService'
import type { VaccineRecord, NewVaccineRecord, VaccineStatus } from '../../types/vaccine'

function sortByDueDateAsc(records: VaccineRecord[]): VaccineRecord[] {
  return [...records].sort((a, b) => `${a.dueDate}T${a.dueTime ?? '00:00'}`.localeCompare(`${b.dueDate}T${b.dueTime ?? '00:00'}`))
}

function sortByCompletedDateDesc(records: VaccineRecord[]): VaccineRecord[] {
  return [...records].sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''))
}

/** Recomputes 'upcoming' vs 'missed' for records whose due date has passed
 * without being marked completed. Pure/no side effects on records that are
 * already 'completed'. */
function withComputedStatus(record: VaccineRecord): VaccineRecord {
  if (record.status === 'completed') return record
  const overdue = record.dueDate < todayIso()
  const status: VaccineStatus = overdue ? 'missed' : 'upcoming'
  return status === record.status ? record : { ...record, status }
}

export async function getAllVaccines(): Promise<VaccineRecord[]> {
  const records = await getAllRecords(STORE.vaccinations)
  return records.map(withComputedStatus)
}

export async function getUpcomingVaccines(): Promise<VaccineRecord[]> {
  const all = await getAllVaccines()
  return sortByDueDateAsc(all.filter((r) => r.status === 'upcoming' || r.status === 'missed'))
}

export async function getCompletedVaccines(): Promise<VaccineRecord[]> {
  const all = await getAllVaccines()
  return sortByCompletedDateDesc(all.filter((r) => r.status === 'completed'))
}

/** The single most relevant upcoming/overdue vaccine to surface on the dashboard. */
export async function getNextVaccine(): Promise<VaccineRecord | undefined> {
  const upcoming = await getUpcomingVaccines()
  return upcoming[0]
}

export async function addVaccine(input: NewVaccineRecord): Promise<VaccineRecord> {
  const now = new Date().toISOString()
  const record: VaccineRecord = {
    ...input,
    id: generateId(),
    status: 'upcoming',
    createdAt: now,
    updatedAt: now,
  }
  await putRecord(STORE.vaccinations, withComputedStatus(record))
  scheduleCloudPush()
  return record
}

export async function updateVaccine(
  id: string,
  updates: Partial<NewVaccineRecord>,
  existing: VaccineRecord,
): Promise<VaccineRecord> {
  const record = withComputedStatus({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  })
  await putRecord(STORE.vaccinations, record)
  scheduleCloudPush()
  return record
}

export async function markVaccineCompleted(
  existing: VaccineRecord,
  details: { completedDate: string; completedTime?: string; notes?: string },
): Promise<VaccineRecord> {
  const record: VaccineRecord = {
    ...existing,
    status: 'completed',
    completedDate: details.completedDate,
    completedTime: details.completedTime,
    notes: details.notes ?? existing.notes,
    updatedAt: new Date().toISOString(),
  }
  await putRecord(STORE.vaccinations, record)
  scheduleCloudPush()
  return record
}

export async function reopenVaccine(existing: VaccineRecord): Promise<VaccineRecord> {
  const record = withComputedStatus({
    ...existing,
    status: 'upcoming',
    completedDate: undefined,
    completedTime: undefined,
    updatedAt: new Date().toISOString(),
  })
  await putRecord(STORE.vaccinations, record)
  scheduleCloudPush()
  return record
}

export async function deleteVaccine(id: string): Promise<void> {
  await deleteRecordWithTombstone(STORE.vaccinations, id)
  scheduleCloudPush()
}

export async function getVaccineById(id: string): Promise<VaccineRecord | undefined> {
  const record = await getRecord(STORE.vaccinations, id)
  return record ? withComputedStatus(record) : undefined
}

export function daysUntilDue(dueDateIso: string): number {
  const today = new Date(todayIso())
  const due = new Date(dueDateIso)
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}
