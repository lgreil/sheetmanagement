import { expect, test, type Page } from '@playwright/test';
import { expectAccessible, open, resetDemo } from './demo.ts';

/** The tour for new members: offered once, step by step through the main pages and the profile. */
test.beforeEach(async ({ page }) => resetDemo(page, 'mitglied', { tour: true }));

const card = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });

test('taking the tour, and taking it again from the profile', async ({ page }) => {
	await open(page, '/');
	await expect(card(page, 'Willkommen, Mia!')).toBeVisible();
	await expectAccessible(page);
	await page.getByRole('button', { name: 'Tour starten' }).click();

	// Each step on its page, with the focus on the card for keyboards and screen readers.
	const steps = [
		['/', 'Übersicht'],
		['/kalender', 'Kalender'],
		['/meine-noten', 'Meine Noten'],
		['/stuecke', 'Archiv'],
		['/stuecke', 'Mehr'],
		['/profil', 'Dein Profil'],
		['/profil', 'Hell oder dunkel']
	] as const;
	for (const [index, [path, title]] of steps.entries()) {
		const step = card(page, title);
		await expect(step).toBeVisible();
		await expect(page).toHaveURL(new RegExp(`${path}$`));
		await expect(step.getByText(`Schritt ${index + 1} von`)).toBeVisible();
		await expect(step.getByRole('heading', { name: title })).toBeFocused();
		await step.getByRole('button', { name: 'Weiter' }).click();
	}
	// Notifications only where they're set up; the demo has none, so that step is left out.
	const last = card(page, 'Fertig!');
	await expect(last).toBeVisible();
	await expectAccessible(page);
	await last.getByRole('button', { name: 'Fertig' }).click();
	await expect(last).toBeHidden();

	// Not offered again, also after reloading.
	await open(page, '/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Hallo');
	await expect(card(page, /Willkommen/)).toHaveCount(0);

	await open(page, '/profil');
	await page.getByRole('button', { name: 'Tour noch einmal machen' }).click();
	await expect(card(page, 'Übersicht')).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
});

test('skipping the tour, at the start or at any step', async ({ page }) => {
	await open(page, '/kalender');
	await card(page, 'Willkommen, Mia!').getByRole('button', { name: 'Überspringen' }).click();
	await expect(card(page, /Willkommen/)).toBeHidden();
	await open(page, '/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Hallo');
	await expect(card(page, /Willkommen/)).toHaveCount(0);

	// Started again and ended with Escape: the page keeps going, the focus back on it.
	await open(page, '/profil');
	await page.getByRole('button', { name: 'Tour noch einmal machen' }).click();
	await page.getByRole('button', { name: 'Weiter' }).click();
	await expect(card(page, 'Kalender')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(card(page, 'Kalender')).toBeHidden();
	await expect(page.locator('main')).toBeFocused();
});
