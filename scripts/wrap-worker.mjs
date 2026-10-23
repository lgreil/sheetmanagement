// Runs after `vite build` (#156, #160). The SvelteKit adapter writes a worker that only
// exports `fetch`; the deployed worker also has to export the Durable Object classes and
// the Cron Trigger's `scheduled` handler from src/worker/. The adapter writes its worker to
// `main` from wrangler.toml, so this moves it next door and puts a small entry in its place
// that re-exports it with the classes. Wrangler bundles the TypeScript on deploy.
import fs from 'node:fs';

const main = '.svelte-kit/cloudflare/_worker.js';
// Same depth as `main`, so the adapter's relative import of ../cloudflare-tmp still works.
const kit = '.svelte-kit/cloudflare-kit/_worker.js';

const built = fs.readFileSync(main, 'utf8');
if (built.includes('wrap-worker')) throw new Error(`${main} is already wrapped; run vite build first.`);
fs.mkdirSync('.svelte-kit/cloudflare-kit', { recursive: true });
fs.writeFileSync(kit, built);
fs.writeFileSync(
	main,
	`// Written by scripts/wrap-worker.mjs: SvelteKit's worker plus the Durable Objects and the Cron Trigger.
import kit from '../cloudflare-kit/_worker.js';
import { scheduled } from '../../src/worker/scheduled.ts';
export { SheetWriteLock } from '../../src/worker/sheet-write-lock.ts';

export default {
	...kit,
	scheduled: (controller, env, ctx) => ctx.waitUntil(scheduled(kit, env, ctx))
};
`
);
console.log(`Wrapped ${main}: SheetWriteLock and scheduled added.`);
