import type { SugarReading, BloodPressureReading, Spo2Reading } from './health'
import type { VaccineRecord } from './vaccine'
import type { AppSettings } from './settings'

/** Current backup/export schema version. Bump this and add a migration in
 * `storageService` whenever the shape of an exported record changes. */
export const BACKUP_VERSION = 1

export interface BackupData {
  version: number
  exportedAt: string
  sugarReadings: SugarReading[]
  bpReadings: BloodPressureReading[]
  spo2Readings: Spo2Reading[]
  vaccinations: VaccineRecord[]
  settings?: AppSettings
}
