import { useEffect, useRef } from 'react'
import { subscribeSyncStatus } from '../services/sync/cloudSyncService'

/**
 * Calls `onSynced` every time a background cross-device sync completes
 * successfully (state transitions to 'idle' with a new `lastSyncedAt`).
 *
 * Without this, a page that already rendered from local IndexedDB has no
 * way to know that a moment later, sync pulled in newer records from
 * another device — so it keeps showing stale/empty data until the user
 * happens to navigate away and back. Every data-displaying page should
 * pair this with its own mount-time load, e.g.:
 *
 *   useEffect(load, [])
 *   useSyncRefresh(load)
 */
export function useSyncRefresh(onSynced: () => void): void {
  const lastSeenRef = useRef<string | null>(null)
  const callbackRef = useRef(onSynced)

  // Keep the ref pointing at the latest callback without mutating it
  // during render (an effect, not the render body itself, is where refs
  // should be written).
  useEffect(() => {
    callbackRef.current = onSynced
  })

  useEffect(() => {
    return subscribeSyncStatus((status) => {
      if (status.state === 'idle' && status.lastSyncedAt && status.lastSyncedAt !== lastSeenRef.current) {
        lastSeenRef.current = status.lastSyncedAt
        callbackRef.current()
      }
    })
  }, [])
}
