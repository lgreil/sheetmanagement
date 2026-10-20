import { describe, expect, it } from 'vitest';
import type { Right } from '#lib/access/access.ts';
import { isActive, navGroups, primaryNav } from './nav.ts';

const hrefs = (auth: 'on' | 'off', rights: Right[]) =>
	Object.fromEntries(navGroups({ auth, rights }).map((group) => [group.key, group.items.map((item) => item.href)]));

describe('navGroups', () => {
	it('shows members the parts, concerts, their profile, archive and wishes', () => {
		expect(hrefs('on', ['ansehen'])).toEqual({
			proben: ['/meine-noten', '/konzerte', '/profil'],
			archiv: ['/stuecke', '/fehlende-stimmen'],
			mitmachen: ['/wuensche']
		});
	});

	it('adds the reports and the file-name check for people who look after the sheet music', () => {
		const groups = hrefs('on', ['ansehen', 'stuecke.bearbeiten']);
		expect(groups.mitmachen).toEqual(['/wuensche', '/meldungen']);
		expect(groups.archiv).toEqual(['/stuecke', '/fehlende-stimmen', '/namen']);
	});

	it('gives admins every page', () => {
		expect(hrefs('on', ['ansehen', 'stuecke.bearbeiten', 'mitglieder.verwalten']).verwaltung).toEqual(['/admin', '/setup', '/status']);
	});

	it('keeps setup and status reachable while sign-in is off, without wishes or admin', () => {
		const groups = hrefs('off', ['ansehen']);
		expect(groups.mitmachen).toBeUndefined();
		expect(groups.proben).toEqual(['/meine-noten', '/konzerte']);
		expect(groups.verwaltung).toEqual(['/setup', '/status']);
	});

	it('accepts the rights as a set too', () => {
		expect(navGroups({ auth: 'on', rights: new Set<Right>(['stuecke.bearbeiten']) }).find((g) => g.key === 'mitmachen')?.items).toHaveLength(2);
	});
});

describe('primaryNav', () => {
	it('is home plus the pages members use most, at most five with "Mehr"', () => {
		const nav = primaryNav(navGroups({ auth: 'on', rights: ['ansehen', 'stuecke.bearbeiten', 'mitglieder.verwalten'] }));
		expect(nav.map((item) => item.href)).toEqual(['/', '/meine-noten', '/konzerte', '/stuecke']);
	});
});

describe('isActive', () => {
	it('matches the page and pages below it, and home only exactly', () => {
		expect(isActive('/stuecke', '/stuecke/abc')).toBe(true);
		expect(isActive('/stuecke', '/stueckeliste')).toBe(false);
		expect(isActive('/', '/stuecke')).toBe(false);
		expect(isActive('/', '/')).toBe(true);
	});
});
