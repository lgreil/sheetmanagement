import { expect, test } from '@playwright/test';
import { open, resetDemo } from './demo.ts';

/** What members and the orga team do every week; a change that breaks one fails its pull request (#142). */
test.beforeEach(async ({ page }) => resetDemo(page));

test('signing up for a concert', async ({ page }) => {
	await open(page, '/kalender/demo-herbstkonzert');
	const yes = page.getByRole('button', { name: 'Ich komme' });
	await yes.click();
	await expect(yes).toHaveAttribute('aria-pressed', 'true');
	await page.reload();
	await expect(page.getByRole('button', { name: 'Ich komme' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByText(/1 Zusage/)).toBeVisible();
});

test('the programme editor saves', async ({ page }) => {
	await open(page, '/kalender/demo-herbstkonzert/programm');
	const remove = page.getByRole('button', { name: 'Entfernen' });
	const before = await remove.count();
	expect(before).toBeGreaterThan(1);
	await remove.last().click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByText('Programm gespeichert.')).toBeVisible();
	await open(page, '/kalender/demo-herbstkonzert/programm');
	await expect(page.getByRole('button', { name: 'Entfernen' })).toHaveCount(before - 1);
});

test('taking attendance', async ({ page }) => {
	await open(page, '/kalender/demo-probe-2/anwesenheit');
	const boxes = page.getByRole('checkbox');
	await boxes.first().check({ force: true });
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByText('Anwesenheit gespeichert.')).toBeVisible();
	await expect(page.getByText(/\d+ von \d+ da/)).toBeVisible();
});

test('a YouTube link is saved clean (#133)', async ({ page }) => {
	await open(page, '/stuecke/demo-egmont/bearbeiten');
	const field = page.getByLabel('Hörbeispiel');
	await field.fill('https://youtu.be/dQw4w9WgXcQ?si=Teilen123');
	await field.blur();
	await expect(field).toHaveValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
	await page.getByRole('button', { name: 'Dauer aus dem Video' }).click();
	// The video's length as a suggestion ("8:30"), ready to take over.
	await expect(page.locator('.list').getByText(/^\d+:\d\d$/)).toBeVisible();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/\/stuecke\/demo-egmont(\?|$)/);
	await expect(page.getByRole('link', { name: /Hörbeispiel/ })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('several composers, separated by commas', async ({ page }) => {
	await open(page, '/stuecke/demo-egmont/bearbeiten');
	await page.getByLabel('Komponist', { exact: true }).fill('Beethoven ,Mozart;');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/\/stuecke\/demo-egmont(\?|$)/);
	// Each composer links to their works; the Mozart list now has Egmont too.
	const eyebrow = page.locator('.hero .eyebrow');
	await expect(eyebrow.getByRole('link', { name: 'Beethoven' })).toBeVisible();
	await eyebrow.getByRole('link', { name: 'Mozart' }).click();
	await expect(page).toHaveURL(/komponist=Mozart/);
	await expect(page.getByRole('link', { name: /Egmont Ouvertüre/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /Eine kleine Nachtmusik/ })).toBeVisible();
});

test('settings: colour and features for everyone (#75, #134)', async ({ page }) => {
	await open(page, '/einstellungen');
	await page.getByLabel(/Standardfarbe/).uncheck();
	await page.getByRole('textbox', { name: 'Akzentfarbe' }).fill('#0f766e');
	await page.getByRole('checkbox', { name: /Leihmaterial/ }).uncheck();
	await page.getByRole('button', { name: 'Speichern', exact: true }).click();
	await expect(page.getByText('Gespeichert.')).toBeVisible();
	expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand'))).toBe('#0f766e');
	const response = await page.goto('/leihmaterial');
	expect(response?.status()).toBe(404);
});

test('an instrument with the orchestra’s own name (#143)', async ({ page }) => {
	await open(page, '/einstellungen');
	await page.getByText('Instrumente', { exact: true }).click();
	await page.getByLabel('In der App: Viola').fill('Viola');
	await page.getByRole('button', { name: 'Instrumente speichern' }).click();
	await expect(page.getByText('Gespeichert. Gilt sofort für alle.')).toBeVisible();
	await open(page, '/meine-noten?instrument=Viola');
	await expect(page.getByText('Bratsche')).toHaveCount(0);
});

test('quick search jumps to a piece and to a page', async ({ page }) => {
	await open(page, '/');
	await page.getByRole('button', { name: 'Suchen', exact: true }).click();
	const search = page.getByRole('combobox', { name: 'Schnellsuche' });
	await search.fill('egmont');
	await expect(page.getByRole('option', { name: /Egmont/ })).toBeVisible();
	await search.press('Enter');
	await expect(page).toHaveURL(/\/stuecke\/demo-egmont/);

	await page.keyboard.press('Control+k');
	await search.fill('kalender');
	await search.press('Enter');
	await expect(page).toHaveURL(/\/kalender$/);
});

test('picking an instrument from the grid (#165)', async ({ page }) => {
	await open(page, '/meine-noten');
	const change = page.getByRole('button', { name: 'Ändern' });
	if (await change.isVisible()) await change.click();
	await page.getByRole('button', { name: /^Instrument/ }).first().click();
	await page.getByRole('searchbox', { name: 'Instrument suchen …' }).fill('cello');
	await page.getByRole('button', { name: 'Cello', exact: true }).click();
	await page.locator('form.picker').getByRole('button', { name: 'Merken' }).click();
	await expect(page.getByText('Gemerkt.')).toBeVisible();
	await expect(page.locator('.chip')).toContainText('Cello');
});

test('the current programme in Drive follows the programme (#60)', async ({ page }) => {
	await open(page, '/kalender/demo-herbstkonzert');
	// EO and A play this concert, each with its own programme and folder.
	const drive = page.locator('form.drive').first();
	const driveA = page.locator('form.drive').last();
	await expect(drive).toContainText('Alle 4 Stücke');
	await expect(driveA).toContainText('Noch kein Programmordner für A');
	await open(page, '/kalender/demo-herbstkonzert/programm');
	await page.getByRole('button', { name: 'Entfernen' }).last().click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByText('Auch im Drive-Ordner »Aktuelles Programm« abgeglichen.')).toBeVisible();
	await expect(drive).toContainText('Alle 3 Stücke');
	await expect(driveA).toContainText('Noch kein Programmordner für A');
	await drive.getByRole('button', { name: 'Abgleichen' }).click();
	await expect(drive).toContainText('Abgeglichen: 0 ergänzt, 0 herausgenommen.');
	await driveA.getByRole('button', { name: 'Abgleichen' }).click();
	await expect(driveA).toContainText('Abgeglichen: 2 ergänzt, 0 herausgenommen.');
});

test('a date poll from start to calendar (#95)', async ({ page }) => {
	await open(page, '/termine');
	await page.getByText('Neue Umfrage').click();
	await page.getByLabel('Worum geht es?').fill('Sommerfest');
	const dates = page.locator('input[name="date"]');
	await dates.nth(0).fill('2027-07-03');
	await dates.nth(1).fill('2027-07-10');
	await page.locator('input[name="start"]').nth(1).fill('18:00');
	await page.getByRole('checkbox', { name: 'Orga' }).check();
	await page.getByRole('button', { name: 'Umfrage starten' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Sommerfest' })).toBeVisible();

	await page.getByRole('group', { name: /10\. Juli 2027/ }).getByRole('radio', { name: 'Ja' }).check();
	await page.getByRole('group', { name: /3\. Juli 2027/ }).getByRole('radio', { name: 'Vielleicht' }).check();
	await page.getByRole('button', { name: 'Antwort speichern' }).click();
	await expect(page.getByText('Antwort gespeichert.')).toBeVisible();
	await expect(page.getByText('Bester Termin')).toBeVisible();

	await page.getByRole('button', { name: /Diesen nehmen \(Samstag, 10\. Juli 2027/ }).click();
	await expect(page.getByRole('link', { name: 'In Google Kalender eintragen' })).toHaveAttribute('href', /dates=20270710T180000/);
});

test('a note on a piece reaches the section’s Meine Noten (#125)', async ({ page }) => {
	await open(page, '/stuecke/demo-morgenstimmung');
	await page.getByText('Hinweis hinzufügen').click();
	await page.getByRole('textbox', { name: 'Hinweis' }).fill('Takt 12 bis 20 nur die Hälfte der Geigen');
	await page.locator('select[name="section"]').selectOption('Streicher');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByText('Hinweis gespeichert.')).toBeVisible();
	await expect(page.getByText('Für Streicher').first()).toBeVisible();
	// Mia plays Geige II: the note shows next to her part.
	await resetDemo(page, 'mitglied');
	await open(page, '/meine-noten');
	await expect(page.getByText('Takt 82–96: Bogen ab Saite, kurz und leicht.').first()).toBeVisible();
	await open(page, '/meine-noten?instrument=Flöte');
	await expect(page.getByText('Takt 82–96: Bogen ab Saite, kurz und leicht.')).toHaveCount(0);
	await expect(page.getByText('Ohne Wiederholung der Exposition').first()).toBeVisible();
});

test('a rehearsal note shows on the start page until the next rehearsal (#145)', async ({ page }) => {
	await open(page, '/kalender/demo-probe-2');
	await page.getByRole('button', { name: 'Notiz bearbeiten' }).click();
	await page.getByRole('textbox', { name: 'Zum Üben' }).fill('Egmont ab Buchstabe C langsam');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByText('Notiz gespeichert.')).toBeVisible();
	await open(page, '/');
	await expect(page.getByText(/Aus der Probe am/)).toBeVisible();
	await expect(page.getByText('Egmont ab Buchstabe C langsam')).toBeVisible();
	// Before the next rehearsal, its page says what to prepare.
	await open(page, '/kalender/demo-probe-3');
	await expect(page.getByRole('heading', { name: /Aus der letzten Probe/ })).toBeVisible();
	await expect(page.getByText('Egmont ab Buchstabe C langsam')).toBeVisible();
});

test('a member downloads their own data (#158)', async ({ page }) => {
	await resetDemo(page, 'mitglied');
	await open(page, '/profil');
	const download = page.waitForEvent('download');
	await page.getByRole('link', { name: 'Meine Daten herunterladen' }).click();
	const file = await download;
	expect(file.suggestedFilename()).toBe('meine-daten-mia-example-org.json');
	const body = await (await page.request.get('/profil/daten.json')).json();
	expect(body.email).toBe('mia@example.org');
	expect(body.data['Mitglieder'][0]['Name']).toBe('Mia Beispiel');
	// Who else gave a wish a +1 stays out.
	expect(JSON.stringify(body)).not.toContain('lea@example.org');
});
