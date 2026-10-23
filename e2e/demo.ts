import { expect, test as base, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { DEMO_PORT } from './ports.ts';

/** Each worker talks to its own demo server (playwright.config.ts), so resets don't hit another worker's test. */
export const test = base.extend({
	baseURL: async ({}, use, testInfo) => use(`http://localhost:${DEMO_PORT + testInfo.parallelIndex}`)
});
export { expect };

/** Back to the demo's sample data, signed in as the admin or as a member. */
export async function resetDemo(page: Page, role: 'verwaltung' | 'mitglied' = 'verwaltung') {
	const response = await page.request.post('/demo', {
		form: { rolle: role, zuruecksetzen: '1', weiter: '/' },
		// Form posts from elsewhere are refused (CSRF): it comes from the app itself.
		headers: { origin: `http://localhost:${DEMO_PORT + test.info().parallelIndex}` },
		maxRedirects: 0
	});
	expect(response.status()).toBe(303);
}

/** Opens a page and waits until it's interactive, so a click isn't lost before the app has started. */
export async function open(page: Page, path: string) {
	await page.goto(path);
	await page.locator('html[data-app="ready"]').waitFor({ state: 'attached' });
}

/** No serious or critical accessibility problems (#141), in light and dark. */
export async function expectAccessible(page: Page) {
	// The colours change with a transition: without it, the check sees the new colours, not halfway there.
	await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
	for (const scheme of ['light', 'dark'] as const) {
		await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
		const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
		const serious = result.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
		expect(
			serious.map((violation) => `${scheme}: ${violation.id} – ${violation.nodes.map((node) => node.target.join(' ')).slice(0, 3).join(', ')}`)
		).toEqual([]);
	}
}
