# DAD Health Tracker 🩺

A simple, elderly-friendly web app for recording a family member's daily
health readings — blood sugar, blood pressure, SpO2 — and their vaccination
schedule. Large buttons, large text, minimal typing, English + Marathi.

This is a **record-keeping and tracking tool**, not a diagnostic or medical
decision-making system. It never interprets readings, suggests treatment,
or recommends medication changes — it just helps you keep a clear diary to
share with a doctor.

## 1. Project Overview

- Track Blood Sugar, Blood Pressure and SpO2 readings, multiple times a day
- Track a vaccine schedule (upcoming / completed / overdue) with reminders
- View history with date-range and reading-type filters
- Simple trend charts over 7/30 days or a custom range
- Full English and Marathi (मराठी) UI, switchable anytime
- Data lives in the browser (IndexedDB) first — instant, and fully usable
  offline — and syncs automatically across every device open to the same
  deployed site (no login; see [§7](#7-data-storage--cross-device-sync))
- Backup/restore via JSON export & import
- Installable as a PWA; keeps working offline once loaded
- Designed to record a reading in well under 15 seconds: open app → tap
  Sugar → enter value → tap "After Breakfast" → Save

## 2. Technology Stack

| Layer       | Choice                                             |
| ----------- | --------------------------------------------------- |
| UI          | React 19 + TypeScript, Vite                          |
| Styling     | Tailwind CSS v4                                      |
| Routing     | React Router                                         |
| Charts      | Recharts (lazy-loaded, only on the Trends page)      |
| Storage     | IndexedDB via the `idb` library (local cache, source of truth per device) |
| Sync backend | 1 Netlify Function + Netlify Blobs (`netlify/functions/household.mts`) |
| PWA         | `vite-plugin-pwa` (installable, offline app shell)   |
| Hosting     | Netlify (static build + 1 serverless function, SPA redirect via `netlify.toml`) |

The sync backend is the only server-side code in the project — one small
function, no database to provision, no third-party account beyond Netlify
itself (which you're already using to host the site).

## 3. Installation

Requires Node.js 20+.

```bash
npm install
```

## 4. Development

```bash
npm run dev
```

Opens the app at `http://localhost:5173` with hot reload. The app is fully
usable this way — but plain `vite dev` doesn't run the sync function, so
cross-device sync will silently stay in its "offline/error" state (by
design — see [§7](#7-data-storage--cross-device-sync)). To develop/test
sync locally:

```bash
npx netlify-cli dev
```

This runs the Vite dev server *and* the `netlify/functions/household.mts`
function together (default: `http://localhost:8888`), so sync works
end-to-end locally too. Requires being logged in to Netlify (`netlify login`)
or just runs Netlify Blobs against a local dev store if not linked to a
real site.

```bash
npm run lint
```

Runs `oxlint` over the project.

## 5. Production Build

```bash
npm run build
```

Type-checks the whole project (`tsc -b`) and produces a static, deployable
build in `dist/`. Preview it locally with:

```bash
npm run preview
```

## 6. Deploying to Netlify

⚠️ **Cross-device sync requires the `netlify/functions/household.mts`
function to be part of the deploy.** A plain drag-and-drop of the `dist/`
folder onto [app.netlify.com](https://app.netlify.com) only uploads the
static build — it does **not** include `netlify/functions/`, so sync
silently won't work (the app still works perfectly locally, it just won't
sync). Use one of these instead:

**Option A — Git-linked (recommended):**

1. Push the whole project (not just `dist/`) to a Git repository
   (GitHub/GitLab/Bitbucket).
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Netlify reads `netlify.toml` automatically — build command `npm run build`,
   publish directory `dist`, functions directory `netlify/functions` are
   already configured. Deploy.
4. Every `git push` after that redeploys automatically, functions included.

**Option B — Netlify CLI (no Git needed):**

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

Run from the project root (not `dist/`) — the CLI builds and uploads both
the static site and the function together.

`netlify.toml` also configures the SPA redirect (`/* -> /index.html`), so
deep links like `/history` or `/vaccines` work correctly when opened
directly, refreshed, or bookmarked.

No environment variables, database, or third-party account (beyond Netlify
itself) are required — Netlify Blobs is provisioned automatically for the
site the function is deployed to.

## 7. Data Storage & Cross-Device Sync

All health and vaccine data lives in **IndexedDB** first, in a database
named `dad-health-tracker`, with one object store per record type:

- `sugarReadings`, `bpReadings`, `spo2Readings`, `vaccinations`
- `settings` (language, display preferences — a single record, **not**
  synced across devices; each device keeps its own)
- `tombstones` (a record of deletions — see below)

Every reading/vaccine record has a unique id (UUID v4), an ISO date
(`YYYY-MM-DD`) and 24-hour time (`HH:mm`) stored separately for reliable
sorting/filtering, plus `createdAt`/`updatedAt` ISO-8601 timestamps. Every
screen reads from and writes to IndexedDB directly — sync is a layer
*on top*, never a requirement, so the app is fully usable offline and
data is never lost if sync is unreachable.

### How sync works

`src/services/sync/cloudSyncService.ts` mirrors the same data to a shared
cloud copy — one JSON document held in **Netlify Blobs**, read/written
through `netlify/functions/household.mts`. There is no login: any device
that can reach the deployed site's URL shares the same data (a single
"household," matching the brief — see [§6](#6-deploying-to-netlify) for
why this needs a proper deploy, not drag-and-drop).

- **When it runs:** once on app start, whenever the browser regains a
  network connection, whenever the tab/app regains focus, and ~1.5s after
  any add/edit/delete (debounced, so a burst of typing doesn't spam the
  network).
- **Merge rule:** last-write-wins by `updatedAt`. Pulling never deletes a
  local record just because the cloud doesn't have it yet (it might be a
  local change not pushed yet) — deletions only propagate via an explicit
  **tombstone** (a `{storeName, recordId, deletedAt}` record), so another
  device can tell "deleted elsewhere" apart from "never synced yet."
- **Settings → Clear All Data** creates a tombstone for every deleted
  record (not just clearing local storage) and pushes immediately without
  pulling first — otherwise the next sync would quietly restore the
  "deleted" data from the cloud. This is the one place sync deliberately
  overwrites instead of merging.
- **If sync fails** (offline, function not deployed, transient error):
  every sync function fails silently and retries later. The app never
  blocks on it, never shows a technical error — Settings shows one plain
  status line ("Could not sync right now — your data is safe on this
  device").

**Privacy:** there is no analytics or tracking script, and health values
are never written to the browser console or put in a URL. Data **is**
sent to your own Netlify site's storage so it can sync — it is not
end-to-end encrypted and not behind a login, so treat the deployed URL
itself as the access control (don't share it outside the family). If you
want the original zero-network guarantee back, that's a one-line change:
stop calling `initCloudSync()` in `App.tsx`.

### Backup / Restore

**Settings → Export Data** downloads a JSON file named like
`dad-health-backup-2026-09-21.json`, shaped as:

```json
{
  "version": 1,
  "exportedAt": "2026-09-21T12:00:00.000Z",
  "sugarReadings": [],
  "bpReadings": [],
  "spo2Readings": [],
  "vaccinations": [],
  "settings": { "key": "app", "language": "en", "largeText": false, "...": "..." }
}
```

The `version` field lets a future release migrate an older backup's shape
forward automatically (see `migrateBackup` in
`src/services/storage/storageService.ts`) — old backups will always keep
working with newer versions of the app.

**Settings → Import Data** reads a previously exported file and restores
its records. Importing is safe to repeat: records are matched by id and
overwritten, so importing the same file twice never creates duplicates,
and existing records that aren't in the file are left untouched.

**Settings → Clear All Data** permanently deletes all health and vaccine
records (after a strong confirmation dialog) — it does **not** touch your
language/display preferences.

## 8. Folder Structure

```text
netlify/
  functions/
    household.mts  The sync backend — GET/PUT one JSON doc via Netlify Blobs

src/
  components/
    common/       Button, Card, Modal-style dialogs, BottomNav, TopBar,
                   EmptyState, LoadingSpinner, form field helpers, etc.
    dashboard/     Today's-snapshot cards, next-vaccine card
    health/        Sugar / BP / SpO2 forms, meal-time icon selector
    vaccine/       Vaccine form, vaccine card, "mark completed" dialog
    history/       History filters, history row
  pages/
    Dashboard/     Home screen
    AddReading/    Smart "+ Add" menu and the 3 reading forms (add + edit)
    History/       Filterable history list
    Trends/        Simple charts (lazy-loaded — pulls in recharts)
    Vaccines/      Upcoming list, history list, add/edit vaccine
    Settings/      Language, display, backup/restore, about
  services/
    storage/       storageService — the ONLY module touching IndexedDB
    health/        healthService — sugar/BP/SpO2 business logic
    vaccine/       vaccineService — vaccine business logic
    settings/      settingsService — language/display preferences
    sync/          cloudSyncService — cross-device sync (pull/merge/push)
  db/
    indexedDb.ts   IndexedDB schema + connection (via `idb`)
  i18n/
    en.ts          English strings (source of truth for every valid key)
    mr.ts           Marathi strings — type-checked against en.ts's keys
    index.ts        translate() + dictionary lookup
  types/            SugarReading, BloodPressureReading, Spo2Reading,
                     VaccineRecord, AppSettings, BackupData
  hooks/            useSettings (language/display + t()), useToast
  utils/            date formatting, validation, labels, id generation
  App.tsx / main.tsx
```

### Why the service layer?

Every screen talks to `healthService` / `vaccineService` / `settingsService`
— never to IndexedDB directly. Those services all sit on top of a single
generic `storageService`. If a future version needs a real backend/API
instead of (or alongside) local storage, only `storageService.ts` needs to
change (e.g. to call `fetch()` instead of `idb`); every page, component and
hook above it keeps working unmodified.

## 9. Adding / Changing Translations

1. Add the new key (with its English text) to `src/i18n/en.ts`.
2. TypeScript will then **fail the build** in `src/i18n/mr.ts` until you add
   the same key there — this makes it impossible to ship a screen with a
   missing Marathi (or English) string.
3. Use it in a component via the translation hook:

   ```tsx
   import { useTranslation } from '../hooks/useSettings'

   function Example() {
     const { t } = useTranslation()
     return <p>{t('dashboard.title')}</p>
   }
   ```

4. For text with a variable, use `{placeholder}` tokens:

   ```ts
   // en.ts
   'vaccine.dueIn': 'Due in {days} days',
   ```

   ```tsx
   t('vaccine.dueIn', { days: 7 }) // "Due in 7 days"
   ```

To add a third language later: create `src/i18n/hi.ts` (for example) typed
as `Record<TranslationKey, string>`, add it to the `dictionaries` map and
the `Language` union in `src/types/settings.ts`, and add a button to
`LanguageSwitch.tsx` / the Settings language section.

## 10. Extending the App Later

The codebase was deliberately kept small and layered so the following are
straightforward additions without a rewrite:

- **Swap local storage for a full backend/database** — reimplement the
  functions in `src/services/storage/storageService.ts` to call a real API;
  every service/hook/page above it is unaffected. (Cloud *sync* already
  exists — see [§7](#7-data-storage--cross-device-sync) — this would be for
  moving local storage itself off-device, e.g. for a doctor-facing web
  view of the data.)
- **Add a login** — the sync backend (`netlify/functions/household.mts`)
  currently trusts anyone who can reach the URL; adding real accounts means
  checking a session/token in that function and keying the Blob by user/
  household id instead of one fixed key.
- **Multiple family members** — add a `profileId` field to each record type
  and a `profiles` store; filter reads/writes by the active profile (the
  sync payload shape would need a matching `profileId` alongside each
  record).
- **Doctor access / PDF reports / CSV export / WhatsApp sharing** — build
  on top of `exportAllData()` / `importAllData()` in `storageService`,
  which already produce a complete, versioned snapshot of the data.
- **New tracked metrics** (weight, temperature, medication, appointments,
  lab tests, ECG, documents) — add a type in `src/types/`, a store in
  `src/db/indexedDb.ts`, a `*Service.ts` file mirroring `healthService.ts`,
  and a form component mirroring `SugarForm.tsx` / `BPForm.tsx`. The
  History, Trends and Dashboard patterns are all designed to extend to a
  new reading type with minimal new code.

## 11. Testing Checklist

Before every release, manually verify:

**Functional** — add sugar (incl. multiple readings same day), add BP, add
SpO2, add vaccine, mark a vaccine completed, edit a reading, delete a
reading (with confirmation), History filters (date range + type), Export,
Import, Clear All Data, language switching (persists after reload).

**Responsive** — a phone-sized viewport (≈390px), a tablet width (≈768px),
and desktop (≥1280px): single-column mobile, comfortably centered content
on larger screens, no horizontal scrolling, no need to zoom.

**Data persistence** — add a reading → refresh the browser → close and
reopen the browser → the reading is still there.

**Backup round-trip** — export a backup → Clear All Data → import that
backup → every record is restored.

**Cross-device sync** (needs `netlify-cli dev`, not plain `vite dev` — see
[§4](#4-development)) — add a reading on one browser profile/device →
open the site in a second, separate browser profile → the reading appears
there after a moment. Delete it on the second device → confirm it
disappears from the first device too (not just locally — reload to force
a fresh sync). Go offline (devtools → Network → Offline) → confirm the app
still works fully and Settings shows a friendly "could not sync" status,
not an error.

## 12. Medical Safety Note

This app is a personal record-keeping diary. It does not diagnose
conditions, does not recommend medication changes, and does not replace
medical advice. The dashboard always shows: *"Please follow your doctor's
instructions for interpreting your readings."*

**Color indicators** (Dashboard + History) show each reading against
general adult reference ranges (`src/utils/readingStatus.ts`) as a green
"In range" / amber "Borderline" / red "Outside range" — always paired
with text, never color alone. These are widely published general bands
(the same kind of thing printed on a home BP monitor), **not a
personalized target** — a doctor may set a different target for a
specific person, and the app says so right next to the colors. The
feature can be turned off entirely in **Settings → Display → Color
Indicators**.
