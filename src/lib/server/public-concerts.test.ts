import { describe, expect, it, vi } from 'vitest';
import { memoryStore } from './db/memory.ts';
import type { Library, LibraryConcert, LibraryPiece } from './library.ts';

const store = memoryStore();
vi.mock('./db/index.ts', () => ({ getStore: () => store }));

const { feedEventsOf, publicFeed, publishedIds, setPublished } = await import('./public-concerts.ts');

const event = (start: string, past: boolean) => ({ start, end: start.replace('T19', 'T21'), allDay: false, location: 'Aula', displayTitle: 'Herbstkonzert', past });

const concert = (id: string, fields: Partial<LibraryConcert>): LibraryConcert =>
	({ id, title: id, date: null, dateKey: '', label: null, orchestras: [], program: [], sharedWith: [], ...fields }) as LibraryConcert;

const library = {
	today: '2026-10-30',
	piecesById: new Map([['p1', { id: 'p1', title: 'Eine kleine Nachtmusik', composer: 'Mozart' } as LibraryPiece]]),
	concertsById: new Map([
		[
			'herbst',
			concert('herbst', {
				event: event('2026-11-15T19:00:00+01:00', false) as LibraryConcert['event'],
				orchestras: ['EO'],
				program: [{ title: 'Eine kleine Nachtmusik', pieceId: 'p1' }, { title: 'Zugabe' }],
				label: { long: 'Sonntag, 15. November 2026', day: '15', month: 'Nov.', year: '2026' }
			})
		],
		['winter', concert('winter', { event: event('2026-12-13T19:00:00+01:00', false) as LibraryConcert['event'] })],
		['1957', concert('1957', { title: 'Weihnachtskonzert', dateKey: '1957-12', location: 'Kirche', label: { long: 'Dezember 1957', day: '', month: 'Dez.', year: '1957' } })],
		['1990', concert('1990', { title: 'Sommerkonzert', dateKey: '1990-06' })],
		['secret', concert('secret', { event: event('2026-11-20T19:00:00+01:00', false) as LibraryConcert['event'] })]
	])
} as unknown as Library;

describe('publicFeed', () => {
	const feed = publicFeed(library, new Set(['winter', 'herbst', '1957', '1990', 'gone']));

	it('has only published concerts, upcoming soonest first', () => {
		expect(feed.upcoming.map((c) => c.id)).toEqual(['herbst', 'winter']);
	});

	it('puts published past concerts in the Chronik part, newest first', () => {
		expect(feed.past.map((c) => c.id)).toEqual(['1990', '1957']);
		expect(feed.past[1]).toMatchObject({ title: 'Weihnachtskonzert', date: '1957-12', dateText: 'Dezember 1957', location: 'Kirche' });
		expect(feed.past[1].start).toBeUndefined();
	});

	it('names the programme with composers, and nothing about members', () => {
		expect(feed.upcoming[0]).toEqual({
			id: 'herbst',
			title: 'Herbstkonzert',
			date: '2026-11-15',
			dateText: 'Sonntag, 15. November 2026',
			start: '2026-11-15T19:00:00+01:00',
			end: '2026-11-15T21:00:00+01:00',
			allDay: false,
			location: 'Aula',
			orchestras: ['EO'],
			program: [{ title: 'Eine kleine Nachtmusik', composer: 'Mozart' }, { title: 'Zugabe' }]
		});
	});

	it('makes calendar events of the upcoming ones only', () => {
		const events = feedEventsOf(feed, 'Programm:');
		expect(events.map((e) => e.uid)).toEqual(['herbst@sheetmanagement-public', 'winter@sheetmanagement-public']);
		expect(events[0].description).toBe('Programm:\nMozart: Eine kleine Nachtmusik\nZugabe');
	});
});

describe('publishing', () => {
	it('keeps the published ids in the store', async () => {
		await setPublished('herbst', true);
		await setPublished('1957', true);
		await setPublished('herbst', false);
		expect([...(await publishedIds())]).toEqual(['1957']);
	});
});
