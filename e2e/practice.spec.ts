import type { Page } from '@playwright/test';
import { expect, expectAccessible, open, resetDemo, test } from './demo.ts';

/** The practice viewer: a member's own part page by page, with their notes, metronome and tuner. */
test.beforeEach(async ({ page }) => resetDemo(page, 'mitglied'));

const PART = '/ueben/demo-egmont-9';

/**
 * A line with the pen, from and to points relative to the page (past 1 is past its edge): by
 * touch on the phone, as fingers and pencils send it, with the mouse on the desktop.
 */
async function draw(page: Page, from: [number, number], to: [number, number]) {
	const box = (await page.locator('svg.marks').boundingBox())!;
	const at = ([x, y]: [number, number]) => ({ x: box.x + box.width * x, y: box.y + box.height * y });
	const steps = Array.from({ length: 9 }, (_, i) => at([from[0] + ((to[0] - from[0]) * i) / 8, from[1] + ((to[1] - from[1]) * i) / 8]));
	if (test.info().project.name === 'phone') {
		await page.locator('svg.marks').evaluate((svg, points) => {
			const send = (type: string, point: { x: number; y: number }) =>
				svg.dispatchEvent(
					new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true, buttons: type === 'pointerup' ? 0 : 1, clientX: point.x, clientY: point.y })
				);
			send('pointerdown', points[0]);
			for (const point of points.slice(1)) send('pointermove', point);
			send('pointerup', points.at(-1)!);
		}, steps);
		return;
	}
	await page.mouse.move(steps[0].x, steps[0].y);
	await page.mouse.down();
	for (const step of steps.slice(1)) await page.mouse.move(step.x, step.y);
	await page.mouse.up();
}

test('Meine Noten opens the part in the practice viewer, which draws it', async ({ page }) => {
	await open(page, '/meine-noten');
	await expect(page.locator('a.part').first()).toHaveAttribute('href', /^\/ueben\//);
	await open(page, PART);
	await expect(page.locator('.slot canvas')).toHaveCount(1);
	await expect(page.getByText('Seite 1 von 1')).toBeVisible();
	await expect(page.getByText(/Zählt als Probenzeit/)).toBeVisible();
	await expectAccessible(page);
});

test('the page draws without JavaScript Safari and Android Chrome lack', async ({ page }) => {
	// pdf.js 6's modern build needs these; its legacy build, which the app loads, doesn't.
	await page.addInitScript(() => {
		const gone = [
			[Math, 'sumPrecise'],
			[Promise, 'try'],
			[Map.prototype, 'getOrInsert'],
			[Map.prototype, 'getOrInsertComputed'],
			[WeakMap.prototype, 'getOrInsert'],
			[WeakMap.prototype, 'getOrInsertComputed'],
			[Uint8Array, 'fromBase64'],
			[Uint8Array.prototype, 'toHex']
		] as const;
		for (const [owner, name] of gone) delete (owner as unknown as Record<string, unknown>)[name];
	});
	await open(page, PART);
	await expect(page.locator('.slot canvas')).toHaveCount(1);
	await expect(page.locator('.score .msg.error')).toHaveCount(0);
});

test('a pen mark is saved and still there after reloading, only for its member', async ({ page }) => {
	await open(page, PART);
	await expect(page.locator('.slot canvas')).toHaveCount(1);
	await page.getByRole('button', { name: 'Stift' }).click();
	await page.getByRole('button', { name: 'Rot' }).click();
	const saved = page.waitForResponse((response) => response.url().endsWith('/api/ueben/notizen') && response.request().method() === 'PUT');
	await draw(page, [0.3, 0.3], [0.5, 0.35]);
	expect((await saved).status()).toBe(204);
	await expect(page.getByText('Gespeichert')).toBeVisible();
	// A line drawn past the page's edge is kept too, ending at the edge.
	const again = page.waitForResponse((response) => response.url().endsWith('/api/ueben/notizen') && response.request().method() === 'PUT');
	await draw(page, [0.8, 0.6], [1.3, 0.7]);
	expect((await again).status()).toBe(204);

	await open(page, PART);
	await expect(page.locator('svg.marks path')).toHaveCount(2);
	// In the member's own data export, and on their profile with a button to delete them all.
	await open(page, '/profil');
	await expect(page.getByText('Notizen in deinen Noten')).toBeVisible();

	// Someone else (the demo admin, who plays nothing) can't save marks in that part.
	const origin = new URL(page.url()).origin;
	await page.request.post('/demo', { form: { rolle: 'verwaltung', weiter: '/' }, headers: { origin }, maxRedirects: 0 });
	const refused = await page.request.put('/api/ueben/notizen', { data: { file: 'demo-egmont-9', page: 1, strokes: [] } });
	expect(refused.status()).toBe(404);
});

test('turning keys, the metronome and the tuner panel', async ({ page }) => {
	await open(page, PART);
	await expect(page.locator('.slot canvas')).toHaveCount(1);
	// A pedal sends these; on a one-page part they stay on it.
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('PageDown');
	await expect(page.getByText('Seite 1 von 1')).toBeVisible();

	await page.getByRole('button', { name: 'Metronom' }).click();
	await page.getByRole('button', { name: 'Schneller' }).click();
	await expect(page.getByRole('spinbutton', { name: 'Schläge pro Minute' })).toHaveValue('81');
	await page.getByRole('button', { name: 'Start' }).click();
	await expect(page.getByRole('button', { name: 'Stopp' })).toBeVisible();
	await page.getByRole('button', { name: 'Stopp' }).click();

	await page.getByRole('button', { name: 'Stimmgerät' }).click();
	await expect(page.getByRole('button', { name: 'Mikrofon einschalten' })).toBeVisible();
	await page.getByRole('button', { name: 'Vollbild' }).click();
	await expect(page.locator('.score.full')).toBeVisible();
	// The page fills the screen: its whole height, or its whole width on a narrow screen.
	await expect
		.poll(() =>
			page.locator('.sheet').evaluate((sheet) => {
				const { top, height, width } = sheet.getBoundingClientRect();
				return Math.round(top) === 0 && (Math.round(height) === innerHeight || Math.round(width) === innerWidth);
			})
		)
		.toBe(true);
	await page.keyboard.press('Escape');
	await expect(page.locator('.score.full')).toHaveCount(0);
});
