// Screenshots for the README and the wiki, taken from the English demo.
//   APP_LANGUAGE=en pnpm exec vite dev --mode demo --port 5181
//   node scripts/screenshots.mjs [http://localhost:5181]
// Writes docs/screenshots/*.png. Fixed sizes, light and dark, so the images stay comparable.
import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://localhost:5181';
const out = 'docs/screenshots';

/** [file, path, role] */
const desktop = [
	['overview', '/', 'verwaltung'],
	['library', '/stuecke', 'verwaltung'],
	['piece', '/stuecke/demo-egmont', 'verwaltung'],
	['calendar', '/kalender', 'verwaltung'],
	['concert', '/kalender/demo-herbstkonzert', 'verwaltung'],
	['my-parts', '/meine-noten', 'mitglied'],
	['history', '/chronik', 'verwaltung'],
	['status', '/status', 'verwaltung']
];
const phone = [
	['phone-overview', '/', 'mitglied'],
	['phone-my-parts', '/meine-noten', 'mitglied'],
	['phone-rehearsal', '/kalender/demo-probe-2', 'mitglied']
];

/** Back to the sample data as the admin or a member, without the tour's card over the page (e2e/demo.ts). */
async function signIn(context, role) {
	const headers = { origin: base };
	const reset = await context.request.post(`${base}/demo`, { form: { rolle: role, zuruecksetzen: '1', weiter: '/' }, headers, maxRedirects: 0 });
	if (reset.status() !== 303) throw new Error(`Demo reset failed: ${reset.status()}`);
	await context.request.post(`${base}/profil?/tour`, { form: { outcome: 'skipped' }, headers: { ...headers, 'x-sveltekit-action': 'true' } });
}

async function shoot(context, shots, scheme, suffix = '') {
	const page = await context.newPage();
	await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
	let role;
	for (const [file, path, shotRole] of shots) {
		if (shotRole !== role) await signIn(context, (role = shotRole));
		await page.goto(base + path);
		await page.locator('html[data-app="ready"]').waitFor({ state: 'attached' });
		await page.waitForLoadState('networkidle');
		await page.screenshot({ path: `${out}/${file}${suffix}.png` });
		console.log(`${file}${suffix}.png`);
	}
	await page.close();
}

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const options = { locale: 'en-GB', timezoneId: 'Europe/Berlin', serviceWorkers: 'block' };
const wide = await browser.newContext({ ...options, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
await shoot(wide, desktop, 'light');
await shoot(wide, desktop.slice(0, 1), 'dark', '-dark');
const narrow = await browser.newContext({ ...options, ...devices['Pixel 7'] });
await shoot(narrow, phone, 'light');
await browser.close();
