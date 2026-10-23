import { describe, expect, it } from 'vitest';
import { t } from '#lib/i18n/index.ts';
import { placeCard, readOutcome, shouldOffer, tourSteps } from './tour.ts';

describe('tourSteps', () => {
	it('goes through the main pages, then the profile', () => {
		expect(tourSteps({ account: true }).map((step) => step.key)).toEqual(['home', 'calendar', 'parts', 'pieces', 'more', 'profile', 'theme', 'notifications', 'done']);
		expect(tourSteps({ account: true }).map((step) => step.path)).toEqual(['/', '/kalender', '/meine-noten', '/stuecke', '/stuecke', '/profil', '/profil', '/profil', '/profil']);
	});

	it('leaves out the profile without an account', () => {
		const steps = tourSteps({ account: false });
		expect(steps.map((step) => step.key)).toEqual(['home', 'calendar', 'parts', 'pieces', 'more', 'doneOpen']);
		expect(steps.some((step) => step.path === '/profil')).toBe(false);
	});

	it('has a title and a text for every step', () => {
		for (const step of [...tourSteps({ account: true }), ...tourSteps({ account: false })]) {
			expect(t.tour.steps[step.key].title).toBeTruthy();
			expect(t.tour.steps[step.key].body).toBeTruthy();
		}
	});
});

describe('readOutcome and shouldOffer', () => {
	it('knows only "done" and "skipped"', () => {
		expect(readOutcome('done')).toBe('done');
		expect(readOutcome('skipped')).toBe('skipped');
		expect(readOutcome('')).toBeNull();
		expect(readOutcome(null)).toBeNull();
		expect(readOutcome('yes')).toBeNull();
	});

	it('asks the browser only when the server can’t tell', () => {
		expect(shouldOffer('offer', 'done')).toBe(true);
		expect(shouldOffer('seen', null)).toBe(false);
		expect(shouldOffer('local', null)).toBe(true);
		expect(shouldOffer('local', 'skipped')).toBe(false);
		expect(shouldOffer('local', 'something else')).toBe(true);
	});
});

describe('placeCard', () => {
	const card = { width: 320, height: 200 };
	const view = { width: 1200, top: 60, bottom: 800 };

	it('goes below a link in the header, centred on it', () => {
		const place = placeCard({ left: 500, top: 12, width: 100, height: 36 }, card, view);
		// Not right under the header's edge: a little space below it.
		expect(place).toEqual({ left: 390, top: 76, side: 'below' });
	});

	it('goes above a tab in the tab bar and stays on the screen', () => {
		const phone = { width: 390, top: 60, bottom: 780 };
		const place = placeCard({ left: 330, top: 784, width: 60, height: 60 }, { width: 358, height: 200 }, phone);
		expect(place.side).toBe('above');
		// Above the tab bar, not only above the tab.
		expect(place.top).toBe(780 - 16 - 200);
		expect(place.left).toBe(16);
	});

	it('sits at the bottom over a target taller than the screen', () => {
		const place = placeCard({ left: 100, top: 100, width: 600, height: 1400 }, card, view);
		expect(place).toEqual({ left: 240, top: 800 - 200 - 16, side: 'over' });
	});

	it('sits at the bottom in the middle without a target', () => {
		expect(placeCard(null, card, view)).toEqual({ left: 440, top: 584, side: 'none' });
	});
});
