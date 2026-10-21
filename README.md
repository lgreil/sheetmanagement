# Sheetmanagement

A lightweight web app for orchestras and ensembles: the **sheet music archive**, **concerts** and **programmes** in one place. It is built on what many ensembles already use:

- **Google Drive**: one folder per piece, one PDF per part
- **Google Calendar**: rehearsals and concerts
- **Google Sheets**: which pieces were played when and where, plus members and rights

Drive and Calendar stay fully usable on their own. The app only reads them and adds a combined view on top.

> **Status:** early rewrite. The skeleton, the Google connection, the piece list, concerts from the calendar, the Repertoire sheet with programmes, and sign-in with rights and a programme editor (phases 0–5) are done; "Meine Noten" and the other extras come next. See [docs/redesign-plan.md](docs/redesign-plan.md) for the full plan.

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
| `pnpm preview` | Build and run the real Worker locally with Wrangler |
| `pnpm run deploy` | Build and deploy to Cloudflare (`run` is needed: `pnpm deploy` is a built-in pnpm command) |

On Windows, stop a running `pnpm preview` (or `pnpm dev`) before building again: the running Worker locks the build folder.

### Try it without Google: demo mode

```bash
pnpm dev:demo
```

The demo needs no Google account and no settings. It uses invented sample data: a small archive with generated PDFs, rehearsals and concerts around today, and a filled-in Repertoire sheet with members, a rehearsal plan, sign-ups, reports and wishes. You're signed in automatically. The banner at the top switches between the admin's and a member's view, and resets the data.

Everything works, including the editors, but changes stay in memory: they're gone after a restart. Nothing is sent to Google.

- The settings come from `[env.demo]` in `wrangler.toml`. If you also have a `.dev.vars` with real settings, create an empty `.dev.vars.demo`, otherwise Wrangler loads `.dev.vars` for the demo too.
- A public demo is a separate Worker that needs no secrets: `pnpm build && pnpm wrangler deploy --env demo`. On Cloudflare each Worker instance keeps its own copy of the data, so visitors may see each other's changes for a while, or not.

## Deploying (free)

1. Create a free [Cloudflare account](https://dash.cloudflare.com/sign-up).
2. `pnpm wrangler login`
3. `pnpm run deploy`. The app is then live at `https://noten.<your-account>.workers.dev`. Change `name` in `wrangler.toml` to pick another subdomain.
4. Connect Google Drive, Calendar and Sheets, and turn on sign-in: follow [docs/setup-google.md](docs/setup-google.md) (about 15 minutes, free). Deployment values are stored as secrets, e.g. `pnpm wrangler secret put ORCHESTRA_NAME`. All values are listed in [`.dev.vars.example`](.dev.vars.example).
5. Open `/status` on your deployment to check every connection, then `/setup` to prepare the Repertoire sheet.

The first deploy also creates a small KV namespace (`CACHE`) for caching the archive index. Wrangler may write its id into `wrangler.toml`; the id is not secret.

**Nothing deployment-specific belongs in the repository.** Ids, keys and member data go into Cloudflare secrets or the Google Sheet.

### Automatic deploys from GitHub

Once set up, every merge into `main` deploys by itself (`.github/workflows/deploy.yml`): it type-checks, tests, builds, deploys with Wrangler and then runs a smoke test against the live site (`.github/scripts/smoke-test.sh`). It can also be started by hand under **Actions → Deploy → Run workflow**.

It needs, in the GitHub repository settings:

- Secret `CLOUDFLARE_API_TOKEN`: a Cloudflare API token from the template **Edit Cloudflare Workers** (Cloudflare dashboard → My Profile → API Tokens).
- Secret `CLOUDFLARE_ACCOUNT_ID`: shown by `pnpm wrangler whoami`.
- Variable `APP_URL`: the app's address, e.g. `https://noten.<your-account>.workers.dev`.

The app's own settings (Google keys, ids, sign-in) stay Cloudflare secrets, set once with `wrangler secret put`; the workflow doesn't touch them.

### Checks on pull requests

`.github/workflows/ci.yml` runs `pnpm check`, `pnpm test` and `pnpm build` on every pull request. With branch protection on `main`, it and CodeQL have to pass before merging. Dependabot opens grouped update PRs every Monday (`.github/dependabot.yml`).

## Adapting it for your orchestra

Everything orchestra-specific lives in [`src/lib/config/`](src/lib/config):

- **Instruments**: names, display order, alternative spellings
- **Naming rules**: how part files are named (separator, status words like `FEHLT`, the `@` prefix for scores)
- **Event keywords**: which calendar titles count as concert, rehearsal or dress rehearsal
- **Name and accent colour**

Copy `presets/bachkreis.ts`, adjust it, and select your preset in `config/index.ts`. All texts are in [`src/lib/i18n/de.ts`](src/lib/i18n/de.ts).

## Contributing

Issues and pull requests are welcome. Please keep it lightweight: think twice before adding a dependency.

## License

[MIT](LICENSE)
