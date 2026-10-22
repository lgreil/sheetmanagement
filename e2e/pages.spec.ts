import { expect, test } from '@playwright/test';
import { expectAccessible, open, resetDemo } from './demo.ts';

/** The main pages open, show what they're for, and pass the accessibility check (#141, #142). */
test.beforeEach(async ({ page }) => resetDemo(page));

test('start page: greeting, open work and the next dates', async ({ page }) => {
	await open(page, '/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Hallo');
	await expect(page.getByText('Wartet auf dich')).toBeVisible();
	await expect(page.getByText('Nächste Probe')).toBeVisible();
	await expectAccessible(page);
});

test('concert page with the programme', async ({ page }) => {
	await open(page, '/konzerte/demo-herbstkonzert');
	await expect(page.getByRole('heading', { level: 1, name: 'Herbstkonzert' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Bist du dabei?' })).toBeVisible();
	await expect(page.getByText('Egmont Ouvertüre').first()).toBeVisible();
	await expectAccessible(page);
});

test('archive and a piece', async ({ page }) => {
	await open(page, '/stuecke');
	await page.getByRole('link', { name: /Egmont Ouvertüre/ }).click();
	await expect(page).toHaveURL(/\/stuecke\/demo-egmont$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Egmont Ouvertüre' })).toBeVisible();
	await expectAccessible(page);
});

test('Meine Noten for a member', async ({ page }) => {
	await resetDemo(page, 'mitglied');
	await open(page, '/meine-noten');
	await expect(page.getByRole('heading', { level: 1, name: 'Meine Noten' })).toBeVisible();
	await expect(page.getByRole('heading', { name: /Herbstkonzert/ }).first()).toBeVisible();
	await expectAccessible(page);
});

test('workspace tabs count open work (#139)', async ({ page }) => {
	await open(page, '/meldungen');
	const tabs = page.getByRole('navigation', { name: 'Noten pflegen' });
	await expect(tabs.getByRole('link', { name: /Meldungen\s*1 offen/ })).toBeVisible();
	await expectAccessible(page);
});

test('the "Mehr" menu takes and returns focus', async ({ page }) => {
	await open(page, '/stuecke');
	const more = page.getByRole('button', { name: 'Mehr' }).filter({ visible: true });
	await more.click();
	const menu = page.getByRole('dialog', { name: 'Alle Seiten' });
	await expect(menu).toBeVisible();
	await expect(menu.locator(':focus')).toHaveCount(1);
	await page.keyboard.press('Escape');
	await expect(menu).toBeHidden();
	await expect(more).toBeFocused();
});

test('settings page', async ({ page }) => {
	await open(page, '/einstellungen');
	await expect(page.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Funktionen' })).toBeVisible();
	await expectAccessible(page);
});

test('date polls: only for their groups (#95)', async ({ page }) => {
	await open(page, '/termine');
	await expect(page.getByRole('heading', { level: 1, name: 'Terminumfragen' })).toBeVisible();
	await page.getByRole('link', { name: /Probenwochenende/ }).click();
	await expect(page.getByText('Bester Termin')).toBeVisible();
	await expectAccessible(page);

	// A member outside Orga, Dirigat and Vorstand sees neither the entry nor the poll.
	const url = page.url();
	await resetDemo(page, 'mitglied');
	await open(page, '/termine');
	await expect(page.getByText('Gerade läuft keine Umfrage für dich.')).toBeVisible();
	const response = await page.goto(url);
	expect(response?.status()).toBe(404);
});
