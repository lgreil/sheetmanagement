import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Back to the demo's sample data, signed in as the admin or as a member. The tour for new
 * members is skipped, so its card doesn't sit over the page; `tour: true` keeps it.
 */
export async function resetDemo(page: Page, role: 'verwaltung' | 'mitglied' = 'verwaltung', { tour = false } = {}) {
	// Form posts from elsewhere are refused (CSRF): it comes from the app itself.
	const origin = new URL(test.info().project.use.baseURL!).origin;
	const response = await page.request.post('/demo', {
		form: { rolle: role, zuruecksetzen: '1', weiter: '/' },
		headers: { origin },
		maxRedirects: 0
	});
	expect(response.status()).toBe(303);
	if (tour) return;
	const skipped = await page.request.post('/profil?/tour', { form: { outcome: 'skipped' }, headers: { origin, 'x-sveltekit-action': 'true' } });
	expect(skipped.ok()).toBe(true);
}

/** Opens a page and waits until it's interactive, so a click isn't lost before the app has started. */
export async function open(page: Page, path: string) {
	await page.goto(path);
	await page.locator('html[data-app="ready"]').waitFor({ state: 'attached' });
}

/** No serious or critical accessibility problems (#141), in light and dark. */
export async function expectAccessible(page: Page) {
	for (const scheme of ['light', 'dark'] as const) {
		await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
		const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
		const serious = result.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
		expect(
			serious.map((violation) => `${scheme}: ${violation.id} – ${violation.nodes.map((node) => node.target.join(' ')).slice(0, 3).join(', ')}`)
		).toEqual([]);
	}
}
