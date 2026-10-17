# Redesign plan: Sheetmanagement on Google Calendar + Google Drive

Status: plan only, nothing implemented yet. Written 2026-10-17, decisions added the same day.

## 1. Where things stand

**The app today**

- Nuxt 3 + Nuxt UI + Tailwind front end. It expects a separate backend (`sheetmanagementStore`, Postgres) at `API_URL` (`/stuecke`, `/stuecke/:id`).
- With no backend running, everything falls back to hard-coded dummy data (`composables/useMusicData.ts`).
- Login is a mock (`composables/useAuth.ts`, `server/api/auth/*` always return "Test User").
- `pages/concerts.vue` shows a calendar, but its events are hard-coded in the page.
- Data model: `Piece { stid, name, genre, jahr, schwierigkeit, isdigitalisiert, komponiert[], arrangiert[] }`. There is no concert entity and no link to files.
- Pages like `instrumente`, `profile` and `contact` are mostly placeholders.

Very little real logic exists, so a rewrite costs almost nothing.

**The real infrastructure**

- **Google Calendar** `Probentermine Ehemaligenorchester` (owned by the orchestra's Google account, public). It holds rehearsals ("Probe Herbstkonzert 🎶🍂"), the Generalprobe and concerts ("Herbstkonzert", "1./2. Weihnachtskonzert"), with the location set. There is no programme info in the events yet.
- **Google Drive** `Noten Upload` (owned by the orchestra's Google account):
  - `01 | Aktuelles Programm/` → `Programm A-Orchester`, `Programm B-Orchester`, `Programm Ehemaligenorchester`, each with one folder per piece (some are shortcuts).
  - `90 | Notenarchiv/` → ~96 piece folders plus `00 | Weihnachtsstücke/`.
  - `91 | Prüfstatus Stücke.md`, `92 | Fehlende Stimmen.md`, `93 | Namenskonvention.md`, `93 | Fortschritt …`, plus several "Ergänzung …" files. These are lists kept by hand that the app could generate.
- **The naming convention is the key asset.** Folder names are `<Komponist> <Opus/BWV> - <Titel>` for classical works and just the title for modern ones. Files are `<Kurztitel> - <Stimme>[ - FEHLT|LEER|UNVOLLSTÄNDIG].pdf`, `@` means Partitur/Solo, and missing parts are Google Doc placeholders. That makes Drive **machine-readable**: the app can parse composer, catalogue number, parts and part status straight from the names.

## 2. Decisions

| Topic | Decision |
|---|---|
| Hosting | **Cloudflare Workers**, free plan. |
| URL | Free: `<name>.<account>.workers.dev` (e.g. `bachkreis-noten…`). The orchestra owns no domain, and a new one costs ~€10/year, so no custom domain. |
| Open source | Public FOSS repo, reusable by other orchestras through configuration. No private data or ids committed (see §9). |
| Framework | **SvelteKit** instead of Nuxt (see §3). |
| Old backend | `sheetmanagementStore` and its Postgres are retired. No data is imported. |
| Data store | **Google Sheet** "Repertoire". Drive and Calendar are only read (see §4). |
| Rights | Role-based: admins grant rights to individual users or to groups (see §6). |
| Scope | Ehemaligenorchester (EO) first. The data model already has an "Orchester" field, so A/B can be added later. A-Orchester pieces the EO plays are just links to the same Drive folders. |
| History | Back to the founding in the 1950s, so the model allows only a year being known, and pieces with no sheet music in Drive (see §5). |
| Cost | **€0.** See the cost check below. |

### Cost check: everything stays free

- **Google Cloud project + service account:** free, and no billing account or credit card needed. The Drive, Calendar and Sheets APIs have no charge, only per-minute quotas far above what an orchestra uses.
- **Google sign-in (OAuth) for members:** free. Only the basic scopes (`openid email profile`) are requested, and those need no Google verification. The app must be switched from "Testing" to "In production" in the consent screen, otherwise logins expire after 7 days and only 100 test users are allowed.
- **Cloudflare Workers free plan:** 100,000 requests/day, plenty. The one tight limit is **10 ms CPU per request** (waiting on Google doesn't count), so heavy work like merging PDFs runs in the browser instead (§7, feature 6).
- **Cloudflare KV** (small key/value cache) free tier: 100,000 reads and 1,000 writes per day. Used only for the Drive index cache, which is refreshed every few minutes, so it stays well under the limit.

## 3. Stack: lightweight, few dependencies

**SvelteKit** with `@sveltejs/adapter-cloudflare`, running on Cloudflare Workers.

- **Runtime dependencies: none besides SvelteKit itself.** Dev dependencies are `svelte`, `@sveltejs/kit`, `vite`, the Cloudflare adapter and `vitest`. Compare today's Nuxt setup with ~30 packages.
- **No `googleapis` package.** It's huge and doesn't run on Workers. The Drive, Calendar and Sheets REST APIs are called with plain `fetch`. The service-account login (a signed JWT) uses the built-in WebCrypto. That's about 40 lines of code instead of a dependency.
- **No Tailwind or UI kit.** Plain CSS with a few design tokens (colours, spacing, light/dark). Svelte's scoped styles and built-in transitions give the modern, smooth feel without a framework.
- **One optional library:** `pdf-lib`, loaded only in the browser and only when someone clicks "merge my parts into one PDF".
- Why SvelteKit over the alternatives:
  - Nuxt: much heavier, and its Google libraries don't fit Workers.
  - Astro: great for content pages, but the programme editor and filters are app-like.
  - Hono + htmx: fewest dependencies, but harder to make feel smooth (instant filters, drag-to-reorder).
  - SvelteKit is the best middle ground: tiny bundles, first-class Cloudflare support, and server routes and pages in one project.
- The rewrite happens **in this repository**. The Nuxt code is removed in the first implementation step, and git history keeps it.

## 4. Architecture

### Design principle: Drive and Calendar keep working on their own

Many members will never open the app. They look at the calendar or click through Drive. So:

- **Nothing the app needs may make Drive or Calendar worse to use.** No longer folder names, no ID codes in names, no machine text in event descriptions.
- Drive keeps the agreed naming convention, which is already short and readable. The app *reads* the names. It never needs them to change.
- Calendar events stay as they are: a title, a time, a place. The app *reads* them.
- The app is an **extra view** that combines the two. It's never required to use either one.

### Why a Google Sheet holds the links

The app needs to store a few things that belong to neither service: which pieces were played at which concert, in which order, metadata like genre, and the rights. Compared options:

| | Hidden calendar properties | **Google Sheet** | Own DB (SQLite/Postgres) |
|---|---|---|---|
| Clutters Calendar or Drive? | Calendar no (hidden); description yes if written | **No.** One extra file in Drive | No |
| Readable and fixable by hand, without the app? | ❌ Invisible, so only the app can change it | **✅ Ordinary spreadsheet, with dropdowns** | ❌ Developers only |
| Concerts back to the 1950s | Have to create ~70 years of past events, which clutters the calendar | **✅ Just add a row** | ✅ |
| Rehearsal plans, metadata, rights | Clumsy (properties limited to 1 kB per value) | **✅ More tabs** | ✅ |
| Needs write access to the *public* calendar | Yes | **No. Read access is enough** | No |
| If the app is ever abandoned | Data is stuck in hidden fields | **✅ Still a useful repertoire list** | Data is stuck in a DB |
| Cost | Free | **Free** | Free tiers exist (Cloudflare D1), but it's one more thing to back up |

**Decision: Google Sheet.** It's the only option usable *without* the app. A deleted concert event leaves a row the app shows as "event no longer in calendar", so nothing is lost silently.

### Shape

```
 Google Calendar (read only)         Google Drive "Noten Upload" (read; writes only on request)
 events: title, time, place          folders = pieces, PDFs = parts, names per convention
          │                                     │
          └───────────────┬─────────────────────┘
                          ▼
        SvelteKit on Cloudflare Workers, Google service account (fetch + WebCrypto)
          pages:  /  /stuecke  /stuecke/[id]  /konzerte  /konzerte/[id]  /meine-noten  /admin
          cache:  Drive index in KV (refreshed every ~5 min), sheet cached ~1 min
                          │
                          ▼
        Google Sheet "Repertoire": the only place the app writes to
```

- **Service account:** *read* access to the calendar and `Noten Upload`, *edit* access only to the Repertoire sheet. The calendar is never written to.
- **Display names in the app.** The app shows clean names ("Jesu bleibet meine Freude", with "Bach · BWV 147" as a subtitle; "Geige II" instead of the full file name), so nobody has to rename anything in Drive.
- **PDFs are opened through Drive's own viewer** (the members' own Google login), so the Worker never streams large files. Only the "merge into one PDF" feature downloads files, through the app and with a member check.

## 5. Sheet layout and data model

Each tab has human columns on the left and an id column on the far right, which can be greyed out. People edit by name, using dropdowns. The app keeps the id columns in sync.

- **Stücke**: Titel · Komponist · Arrangeur · Genre · Schwierigkeit · Notiz · Geprüft am · _Drive-Ordner-ID_
  - The app adds new Drive folders automatically, with Titel and Komponist pre-filled from the folder name.
  - **Historical pieces without sheet music in Drive** are just rows with no Drive id. The app shows them as "keine Noten im Archiv".
- **Konzerte**: Datum · Anlass · Ort · Orchester · _Kalender-Event-ID_
  - Calendar concerts are added automatically.
  - **Datum may be imprecise** for old concerts: `1957`, `1957-12` or `1957-12-21` are all valid, and the app sorts and displays them accordingly ("Dez. 1957").
  - Orchester: `EO` for now, `A`/`B` later.
- **Programm**: Konzert ▾ · Nr. · Stück ▾ · Notiz
  - Both are dropdowns, so entering "Weihnachtskonzert 1962 / 3 / Sleigh Ride" is all it takes. Nr. can stay empty when the order isn't known (common for old programmes).
- **Fehlende Stimmen** (generated, read-only): built from the `FEHLT`/`LEER`/`UNVOLLSTÄNDIG` file names, with an "erledigt" column.
- **Mitglieder**, **Gruppen**, **Rechte**: see §6.
- *(later)* **Proben**: Probe ▾ · Stück ▾, for the rehearsal plan.

```ts
Piece {
  key: string             // stable row key (Drive folder id when there is one)
  driveFolderId?: string  // absent for historical pieces without sheet music
  title, composer?, catalogue?, arranger?, genre?, difficulty?, notes?, reviewedAt?
  category: 'archiv' | 'weihnachten' | 'historisch'
  parts: Part[]           // empty when no Drive folder
  partStatus: 'ok' | 'incomplete' | 'missing' | 'unchecked' | 'none'
}
Part {
  fileId, name, instrument ("Geige II"), transposition? ("in B"),
  kind: 'partitur' | 'solo' | 'stimme' | 'sammelstimme',
  status: 'ok' | 'FEHLT' | 'LEER' | 'UNVOLLSTÄNDIG'
}
Concert {
  key, date: { year: number; month?: number; day?: number },
  title, location?, orchestra: 'EO' | 'A' | 'B', eventId?
}
CalendarEvent { id, title, start, end, location, type: 'konzert'|'probe'|'generalprobe'|'sonstiges' }
ProgramEntry { concertKey, position?, pieceKey, note? }
```

## 6. Rights management

People sign in with their Google account. What they can do comes from three tabs in the sheet, all managed from an `/admin` page in the app (or directly in the sheet).

- **Mitglieder**: E-Mail · Name · Instrument · Gruppen (e.g. `Geigen, Vorstand`)
- **Gruppen**: Gruppe · Beschreibung
- **Rechte**: Wer (a user email *or* a group) · Recht

Rights, kept deliberately few:

| Right | Allows |
|---|---|
| `ansehen` | See pieces, concerts and parts. Every member has this. |
| `programme.bearbeiten` | Edit concert programmes (and rehearsal plans later). |
| `stuecke.bearbeiten` | Edit piece metadata (genre, difficulty, notes, reviewed date). |
| `archiv.bearbeiten` | Add historical concerts and pieces. |
| `mitglieder.verwalten` | Add members, groups and rights. This is the admin right. |

- **Who counts as a member?** Anyone listed in "Mitglieder". New sign-ins that aren't listed see "Zugang beantragen", and an admin approves them with one click.
- **The first admins come from a Cloudflare secret, `BOOTSTRAP_ADMINS`** (comma-separated emails), never from the code. For this deployment that's the orchestra account plus a second admin account as a backup. Bootstrap admins always have every right, so the app can't be locked out by a broken sheet. All other admins are managed in the sheet.
- **Note: the app's rights and Drive's own sharing are separate.** App rights decide what you can do *in the app*. Opening a PDF still needs Drive access to `Noten Upload`, as today. The app shows a clear hint ("Bitte Zugriff auf den Noten-Ordner anfragen") when Drive refuses. Syncing the two automatically would need the app to change Drive sharing, which is left out on purpose.

## 7. Features

### Must-have

1. **Repertoire list from Drive and the sheet.** Every piece appears with a clean title, composer and catalogue number, the number of parts and a status badge (✅ complete / ⚠️ parts missing / 📜 historical, no sheet music). Search and filter by composer, genre, Christmas, "played in the last 2 years", decade.
2. **Piece page.** All parts listed by instrument, in convention order (Partitur first, then woodwinds, brass, percussion, strings). One click opens the PDF in Drive's viewer. It also shows **"Gespielt bei"**: every concert this piece was in, back to the 1950s.
3. **Concert page.** Upcoming concerts and rehearsals come live from the calendar, and past ones come from the sheet. Each concert has its **programme** with direct links to the parts. Rehearsals link to the concert they prepare for ("Probe Herbstkonzert" → Herbstkonzert).
4. **Programme editor** (with `programme.bearbeiten`). Add pieces through a search box and drag to reorder. It writes rows to the sheet's "Programm" tab.
5. **Google login and rights** as described in §6.

### Very nice to have

6. **"Meine Noten".** Each member's instrument comes from "Mitglieder". Every concert page shows a **"Meine Noten fürs Herbstkonzert"** button: their parts for the whole programme, in programme order. "Als eine PDF" merges them in the browser with pdf-lib.
7. **Missing-parts dashboard, generated automatically.** Mirrored into the sheet's "Fehlende Stimmen" tab, which replaces maintaining `91 | Prüfstatus` and `92 | Fehlende Stimmen.md` by hand.
8. **Instrumentation check for programmes.** A matrix of pieces × instruments with gaps highlighted, so missing parts are found *before* the first rehearsal.
9. **Naming-convention linter.** List files that break `93 | Namenskonvention`. Later this could offer one-click renames, always with confirmation and always *towards* the convention.
10. **Fill `01 | Aktuelles Programm` from the next concert's programme** (opt-in button). It creates the folder shortcuts people currently make by hand.

### Later / ideas

11. **Orchestra history ("Chronik").** A timeline from the 1950s with every concert and its programme, plus statistics such as most-played pieces, pieces not played for 10+ years, and how the repertoire changed by decade. This makes the historical data fun to browse.
12. **Rehearsal plan.** A "Proben" tab marks which pieces get rehearsed at which Probe.
13. **Offline mode (PWA).** Cache the next concert's part list (and, if wanted, the PDFs) for rehearsal halls with bad reception.
14. **Programme handout export.** A printable concert programme or a setlist for the conductor.
15. **Audio/reference links per piece.** A "Hörbeispiel" column in the sheet. The existing *werkverzeichnis-lookup* skill already finds them.
16. **A/B-Orchester.** Add their calendars and set Orchester = A/B. Pieces shared with the EO need no extra work.

## 8. Phased roadmap

| Phase | Goal | Main work |
|---|---|---|
| 0 | New skeleton | Replace Nuxt with SvelteKit + Cloudflare adapter in this repo; config folder, `.example` files, `.gitignore`, `LICENSE`; design tokens, layout, light/dark; deploy an empty page to `workers.dev`. |
| 1 | Google plumbing | Service account (free, no billing); `fetch` + WebCrypto clients for Drive, Calendar and Sheets; Drive index cached in KV. |
| 2 | Repertoire from Drive | Folder-name and file-name parser, with unit tests against the real names; piece list and piece page. |
| 3 | Concerts from Calendar | Concert list and detail pages on real events; event type detection. |
| 4 | Sheet + linking | `/setup` creates the Repertoire sheet (tabs, dropdowns, id columns); auto-add new Drive folders and calendar concerts; "Gespielt bei"; read-only programmes. |
| 5 | Login + rights | Google sign-in, Mitglieder/Gruppen/Rechte, `/admin`, programme editor. |
| 6 | Extras | "Meine Noten", missing-parts tab, instrumentation matrix, linter, Chronik, PWA. |

Phases 0–3 alone give a useful read-only app. Entering the historical programmes can start as soon as the sheet exists (phase 4), in parallel with the rest.

## 9. Open source: reusable by other orchestras, no private data in the repo

The repository is public and the project is FOSS. It should work for any orchestra or ensemble that keeps sheet music in Drive and dates in Google Calendar, with only configuration changes.

**Nothing private or deployment-specific is committed:**

- **Secrets go into Cloudflare secrets** (`wrangler secret put …`): the service-account key, the OAuth client secret, the session-signing key and `BOOTSTRAP_ADMINS`.
- **Deployment ids go into environment variables**, also not committed: the calendar id, the Drive folder ids (archive, current programme), the sheet id and the orchestra's display name.
  - Committed are a generic `wrangler.toml` (no ids, `keep_vars = true`) and `.dev.vars.example`, with placeholders and comments.
  - `.gitignore` covers `.dev.vars`, `.env*` and service-account key files.
- **No real member data anywhere in the repo.** Members, emails and instruments live only in the sheet. Tests use invented fixture names (piece titles are fine, they're public works).
- **Docs in the repo stay generic.** Instance-specific facts (account names, folder ids) live in the deployment config or in Drive, not in markdown files.

**What another orchestra adjusts, in one place** (`src/lib/config/`, with the Bachkreis setup as the default example preset):

- **Instruments**: the list, display order, and aliases ("Violine" → "Geige").
- **Naming-convention rules**: separator, status words (`FEHLT`/`LEER`/`UNVOLLSTÄNDIG`), the `@` prefix, and the catalogue patterns (BWV, KV, Op.). If an orchestra has no convention at all, the parser falls back to "folder = piece, every PDF = one part".
- **Event-type keywords** ("Konzert", "Probe", "Generalprobe").
- **UI language and texts**: German first. All strings sit in one file, so an English translation is a single file.
- **Branding**: name, accent colour and logo, via env vars and `static/`.

**Easy setup for newcomers:**

- **`/setup` page**, only reachable by bootstrap admins. It creates the Repertoire sheet with all tabs, headers and dropdowns in a Drive folder of your choice. Nobody has to build the sheet by hand.
- **`README.md` step by step:** create a Google Cloud project (free) → service account → share the folder and calendar with it → Google sign-in client → `wrangler deploy` → open `/setup`. It also states what's free and the limits.
- **Add a `LICENSE` file.** The README already says MIT, but the file is missing.
- *Note:* older commits in this repo already contain personal author emails (git metadata). That can't be undone without rewriting history. For new commits, you could use your GitHub "noreply" address.

## 10. Settled

- **Sheet place:** option (a). `91 | Repertoire` inside `Noten Upload`, replacing the hand-kept `91 | Prüfstatus Stücke.md` and `92 | Fehlende Stimmen.md` (those are deleted after the migration).
- **Domain:** none owned, so the free `….workers.dev` address.
- **Admins:** the orchestra's Google account plus a second admin account, both set via `BOOTSTRAP_ADMINS` at deploy time (never in the repo).

No open questions left. Next step is phase 0.
