# Sheetmanagement

A lightweight web app for orchestras and ensembles: the **sheet music archive**, **concerts** and **programmes** in one place. It is built on what many ensembles already use:

- **Google Drive**: one folder per piece, one PDF per part
- **Google Calendar**: rehearsals and concerts
- **Google Sheets**: which pieces were played when and where, plus members and rights

Drive and Calendar stay fully usable on their own. The app only reads them and adds a combined view on top.

> **Status:** in use, version 0.15. Archive, concerts, programmes, "Meine Noten", sign-ups, rehearsal plans, attendance, rented music, the GEMA list, a personal calendar feed, an offline mode with an update notice, and end-to-end tests are done. New: the Chronik with the orchestra's history in numbers and a printable season report, notes from rehearsals on pieces and after each rehearsal, full composer names for the GEMA list, and a download of one's own data on /profil. What comes next, version by version, is in the pinned [Roadmap issue](https://github.com/lgreil/sheetmanagement/issues/73); the original design is in [docs/redesign-plan.md](docs/redesign-plan.md).

Free and open source (MIT). Hosting on Cloudflare's free plan and Google's free APIs costs nothing.

## Tech

- [SvelteKit](https://svelte.dev/docs/kit) on [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- No runtime dependencies besides SvelteKit; Google APIs are called with plain `fetch`
- Plain CSS with design tokens (`src/app.css`), light and dark mode

## Getting started

Requirements: [Node.js](https://nodejs.org) 22.17 or newer and [pnpm](https://pnpm.io).

```bash
pnpm install
cp .dev.vars.example .dev.vars   # optional: set ORCHESTRA_NAME
pnpm dev
```

Open http://localhost:5173.

Other scripts:

| Script | What it does |
|---|---|
| `pnpm dev:demo` | Run the demo with sample data (see below) |
| `pnpm check` | Type-check the project |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run the end-to-end tests against the demo (Playwright; once: `pnpm exec playwright install chromium`) |
| `pnpm preview` | Build and run the real Worker locally with Wrangler |
| `pnpm run deploy` | Build and deploy to Cloudflare (`run` is needed: `pnpm deploy` is a built-in pnpm command) |

On Windows, stop a running `pnpm preview` (or `pnpm dev`) before building again: the running Worker locks the build folder.

### Try it without Google: demo mode

```bash
pnpm dev:demo
```

The demo needs no Google account and no settings. It uses invented sample data: a small archive with generated PDFs, rehearsals and concerts around today, and a filled-in Repertoire sheet with members, a rehearsal plan, sign-ups, attendance, rented music, piece durations, reports and wishes. You're signed in automatically. The banner at the top switches between the admin's and a member's view, and resets the data.

Everything works, including the editors, but changes stay in memory: they're gone after a restart. Nothing is sent to Google.

- The settings come from `[env.demo]` in `wrangler.toml`. If you also have a `.dev.vars` with real settings, create an empty `.dev.vars.demo`, otherwise Wrangler loads `.dev.vars` for the demo too.
- A public demo is a separate Worker that needs no secrets: `pnpm build && pnpm wrangler deploy --env demo`. On Cloudflare each Worker instance keeps its own copy of the data, so visitors may see each other's changes for a while, or not.

### On the phone

- **Install it:** the app has a web manifest, so "Zum Home-Bildschirm" (Safari) or "App installieren" (Chrome) puts it on the home screen.
- **Offline:** a service worker (`src/service-worker/`) keeps the pages a member opened, and "Offline speichern" on "Meine Noten" keeps their parts, for rehearsal halls without reception. Signing out deletes both.
- **Updates:** after a deploy, an open app shows "Neue Version verfügbar · Neu laden" within a few minutes; nothing reloads by itself.
- **Own calendar:** each member can create a personal calendar link on `/profil` (`/kalender/<token>.ics`) with their orchestra's dates, their own answer and what's rehearsed. It's signed with `SESSION_SECRET` and can be renewed or revoked; the version sits in the "Kalender-Version" column of "Mitglieder".

### Rehearsal notes and the orchestra's history

- **Notes on pieces** ("Hinweise" tab): cuts, repeats and bowings agreed in rehearsal, written on the piece's page by whoever plans programmes. A note can be for one section or instrument and for one concert; members see the ones for their instrument next to their part in "Meine Noten", and notes for concerts that are over are folded away.
- **Notes after a rehearsal** ("Probennotizen" tab): what was rehearsed, what to practise and what comes next. They show on the rehearsal's page, on the next rehearsal's page and on the start page until the next rehearsal is over.
- **Chronik** (`/chronik`): every past concert by decade with its programme, pieces played for the first time marked, and the numbers: most played pieces and composers, pieces not played for ten years, pieces never played, the repertoire per decade. Old concerts only need a year in the sheet.
- **Season report** (`/chronik/saison`, for `mitglieder.verwalten`): a printable summary of a period for the annual meeting: concerts and programmes, new pieces, rehearsals and attendance as totals, reports and wishes.
- **My data** (`/profil`): every member can download what the sheet keeps about them as a JSON file (Art. 15 GDPR), without other people's names or +1s.

The new tabs are optional: the first note creates its tab, and /setup adds them with dropdowns. "Komponist (voll)" in "Stücke" holds the full name for the GEMA list; "Online nachschlagen" on a piece's edit page fills it from Wikidata.

## Deploying (free)

1. Create a free [Cloudflare account](https://dash.cloudflare.com/sign-up).
2. `pnpm wrangler login`
3. `pnpm run deploy`. The app is then live at `https://noten.<your-account>.workers.dev`. Change `name` in `wrangler.toml` to pick another subdomain.
4. Connect Google Drive, Calendar and Sheets, and turn on sign-in: follow [docs/setup-google.md](docs/setup-google.md) (about 15 minutes, free). Deployment values are stored as secrets, e.g. `pnpm wrangler secret put ORCHESTRA_NAME`. All values are listed in [`.dev.vars.example`](.dev.vars.example).
5. Open `/status` on your deployment to check every connection, then `/setup` to prepare the Repertoire sheet.

The first deploy also creates a small KV namespace (`CACHE`) for caching the archive index. Wrangler may write its id into `wrangler.toml`; the id is not secret. It also sets up a Durable Object (`SHEET_LOCK`, free plan) that lets saves to the sheet take turns, so two people saving at once don't end up in each other's rows; it stores nothing. `pnpm build` adds it to the worker (`scripts/wrap-worker.mjs`).

What the app writes itself and nobody edits by hand (push subscriptions, which reminders went out) lives in a D1 database (`DB`, free plan), not in the sheet. To keep it in the EU, create it before the first deploy with `pnpm wrangler d1 create noten --jurisdiction eu` and put its `database_id` into `wrangler.toml`; otherwise the first deploy creates one. Its tables are in `migrations/`. D1 keeps 30 days of history on its own ([Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)): `pnpm wrangler d1 time-travel restore noten --timestamp=…` goes back to any minute in that time.

Reminders need a key pair for Web Push: `node scripts/vapid-keys.mjs`, then store both values with `pnpm wrangler secret put VAPID_PUBLIC_KEY` and `… VAPID_PRIVATE_KEY`. Members turn notifications on per device under **Profil**. A Cron Trigger runs the background jobs: filling the caches, reminders about unanswered rehearsals and rented music that is due, a daily check of the Google connection that notifies the admins when it breaks, and a completeness check that reads a few PDFs per run and lists parts that look empty or much shorter than the others as hints on **Fehlende Stimmen** (it never renames a file by itself). If a retention period is set on **/einstellungen**, a daily job also removes the names from sign-ups and attendance older than that many seasons; the rows stay, so counts don't change. `/status` shows when each last ran and can start one by hand.

Email is optional: an admin connects the orchestra's Google account on `/status` (Gmail, scope `gmail.send` only). Members without a Google account then get a sign-in link by email, and members without notifications get their reminders by email, with one-click answers. See "Email" in [docs/setup-google.md](docs/setup-google.md#email).

**Nothing deployment-specific belongs in the repository.** Ids, keys and member data go into Cloudflare secrets or the Google Sheet.

### Automatic deploys from GitHub

Once set up, every merge into `main` deploys by itself (`.github/workflows/deploy.yml`): it type-checks, tests, builds, deploys with Wrangler and then runs a smoke test against the live site (`.github/scripts/smoke-test.sh`). It can also be started by hand under **Actions → Deploy → Run workflow**.

It needs, in the GitHub repository settings:

- Secret `CLOUDFLARE_API_TOKEN`: a Cloudflare API token from the template **Edit Cloudflare Workers** (Cloudflare dashboard → My Profile → API Tokens). It also applies the database schema, so the token needs **D1: Edit**; add it if the template doesn't include it.
- Secret `CLOUDFLARE_ACCOUNT_ID`: shown by `pnpm wrangler whoami`.
- Variable `APP_URL`: the app's address, e.g. `https://noten.<your-account>.workers.dev`.

The app's own settings (Google keys, ids, sign-in) stay Cloudflare secrets, set once with `wrangler secret put`; the workflow doesn't touch them.

### Checks on pull requests

`.github/workflows/ci.yml` runs `pnpm check`, `pnpm test` and `pnpm build` on every pull request, and in a second job the end-to-end tests: Playwright opens the demo on a desktop and a phone size, goes through the main pages and the weekly flows (signing up, saving a programme, attendance) and checks each page with axe for accessibility problems. Screenshots and traces of a failure are kept as an artifact. With branch protection on `main`, both jobs and CodeQL have to pass before merging. Dependabot opens grouped update PRs every Monday (`.github/dependabot.yml`).

## Adapting it for your orchestra

Name, logo, accent colour, the look (bold: condensed headings and the logo behind the greeting; or plain) and the features in use can be changed by an admin on **/einstellungen** without touching code or variables. The page saves them in the sheet's "Einstellungen" tab; they win over the variables below, which win over the preset, and an empty field falls back to them.

Everything else orchestra-specific lives in [`src/lib/config/`](src/lib/config):

- **Instruments**: names, display order, alternative spellings
- **Naming rules**: how part files are named (separator, status words like `FEHLT`, the `@` prefix for scores)
- **Event keywords**: which calendar titles count as concert, rehearsal or dress rehearsal
- **Name and accent colour**; per deployment also `ORCHESTRA_NAME` and `ORCHESTRA_ACCENT` (`#rrggbb`). The shades for the light and dark scheme are derived from the accent so text stays readable; /status shows them with their contrast
- **Logo**: `ORCHESTRA_LOGO` (a file in `static/` or an https link) replaces `static/logo.png`; the demo uses `static/demo/musterorchester.svg`
- **Features**: what the orchestra doesn't use (rented music, the GEMA list, attendance, sign-ups, wishes, the calendar feed, saving parts offline, the seasonal drawings) is turned off with `features` in the preset or `FEATURES_OFF="leihmaterial, gema"`; its pages, menu entries and sheet tabs go away

Copy `presets/bachkreis.ts`, adjust it, and select your preset in `config/index.ts`.

**Language:** German by default; English with `APP_LANGUAGE=en` when building (`APP_LANGUAGE=en pnpm deploy`, or in a `.env` file). One language per deployment: the texts are in [`src/lib/i18n/de.ts`](src/lib/i18n/de.ts) and [`en.ts`](src/lib/i18n/en.ts), and the type checker makes sure both have every text. A new English deployment also gets English tab and column names in its sheet; an existing sheet keeps its names, so don't switch the language of a deployment that already has one. Instrument names come from the preset and can be renamed on /einstellungen.

## Contributing

Issues and pull requests are welcome. Please keep it lightweight: think twice before adding a dependency.

## License

[MIT](LICENSE)
