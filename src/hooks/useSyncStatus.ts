import { useSyncExternalStore } from 'react'
import { getSyncStatus, subscribeSyncStatus } from '../services/sync/cloudSyncService'
import type { SyncStatus } from '../services/sync/cloudSyncService'

/** Live-subscribes to the cross-device sync status (idle/syncing/offline/error
 * + last-synced time) for display in Settings. */
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatus, getSyncStatus)
}
