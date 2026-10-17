# Sheetmanagement

A lightweight web app for orchestras and ensembles: the **sheet music archive**, **concerts** and **programmes** in one place. It is built on what many ensembles already use:

- **Google Drive**: one folder per piece, one PDF per part
- **Google Calendar**: rehearsals and concerts
- **Google Sheets**: which pieces were played when and where, plus members and rights

Drive and Calendar stay fully usable on their own. The app only reads them and adds a combined view on top.

> **Status:** early rewrite. The skeleton, the Google connection and the piece list (phases 0–2) are done; concerts from the calendar come next. See [docs/redesign-plan.md](docs/redesign-plan.md) for the full plan.

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
| `pnpm check` | Type-check the project |
| `pnpm test` | Run unit tests |
| `pnpm preview` | Build and run the real Worker locally with Wrangler |
| `pnpm run deploy` | Build and deploy to Cloudflare (`run` is needed: `pnpm deploy` is a built-in pnpm command) |

On Windows, stop a running `pnpm preview` before building again: the running Worker locks the build folder.

## Deploying (free)

1. Create a free [Cloudflare account](https://dash.cloudflare.com/sign-up).
2. `pnpm wrangler login`
3. `pnpm run deploy`. The app is then live at `https://sheetmanagement.<your-account>.workers.dev`. Change `name` in `wrangler.toml` to pick another subdomain.
4. Connect Google Drive and Calendar: follow [docs/setup-google.md](docs/setup-google.md) (about 15 minutes, free). Deployment values are stored as secrets, e.g. `pnpm wrangler secret put ORCHESTRA_NAME`. All values are listed in [`.dev.vars.example`](.dev.vars.example).
5. Open `/status` on your deployment to check every connection.

The first deploy also creates a small KV namespace (`CACHE`) for caching the archive index. Wrangler may write its id into `wrangler.toml`; the id is not secret.

**Nothing deployment-specific belongs in the repository.** Ids, keys and member data go into Cloudflare secrets or the Google Sheet.

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
