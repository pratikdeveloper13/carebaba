// Shared cloud storage for cross-device sync — the server side of
// `src/services/sync/cloudSyncService.ts`.
//
// Deliberately simple: one JSON "document" per deployed site, held in
// Netlify Blobs (storage built into the Netlify site itself — no external
// database or account needed). There is no login: anyone who can reach
// this deployed site's URL can read/write it, which matches the app's
// "single household, no accounts" design. All merge logic (last-write-wins,
// tombstones for deletes) lives client-side in cloudSyncService — this
// function just stores and returns whatever JSON it's given.
import type { Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

const BLOB_KEY = 'household-data'

function emptyPayload() {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    sugarReadings: [],
    bpReadings: [],
    spo2Readings: [],
    vaccinations: [],
    tombstones: [],
  }
}

function isHouseholdPayloadShape(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    Array.isArray(v.sugarReadings) &&
    Array.isArray(v.bpReadings) &&
    Array.isArray(v.spo2Readings) &&
    Array.isArray(v.vaccinations) &&
    Array.isArray(v.tombstones)
  )
}

const jsonHeaders = { 'Content-Type': 'application/json' }

export default async (req: Request, _context: Context) => {
  const store = getStore('dad-health-tracker')

  if (req.method === 'GET') {
    const data = await store.get(BLOB_KEY, { type: 'json' })
    return new Response(JSON.stringify(data ?? emptyPayload()), { status: 200, headers: jsonHeaders })
  }

  if (req.method === 'PUT') {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: jsonHeaders })
    }
    if (!isHouseholdPayloadShape(body)) {
      return new Response(JSON.stringify({ error: 'Invalid payload shape' }), { status: 400, headers: jsonHeaders })
    }
    await store.setJSON(BLOB_KEY, body)
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders })
  }

  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, PUT' } })
}

export const config = {
  path: '/api/household',
}
