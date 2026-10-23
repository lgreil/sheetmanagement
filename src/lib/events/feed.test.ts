import { describe, expect, it } from 'vitest';
import { feedEvents } from './feed.ts';
import type { ShownEvent } from './schedule.ts';

const event = (id: string, type: ShownEvent['type'], start: string, past = false): ShownEvent =>
	({
		id,
		title: id,
		displayTitle: id === 'konzert' ? 'Herbstkonzert' : 'Probe',
		type,
		start,
		end: start.replace('T10', 'T13'),
		allDay: false,
		location: 'Aula',
		tentative: false,
		rehearsalIds: [],
		past,
		daysUntil: 0,
		date: {} as ShownEvent['date']
	}) as ShownEvent;

const events = [
	event('alt', 'probe', '2026-01-10T10:00:00Z', true),
	event('probe', 'probe', '2026-10-25T10:00:00Z'),
	event('konzert', 'konzert', '2026-11-15T10:00:00Z'),
	event('a-orchester', 'probe', '2026-10-26T10:00:00Z')
];

const feed = feedEvents({
	events,
	includes: (e) => e.id !== 'a-orchester',
	pieces: (e) => (e.id === 'probe' ? ['Egmont', 'Morgenstimmung'] : e.id === 'konzert' ? ['Egmont'] : []),
	answer: (e) => (e.id === 'probe' ? 'yes' : undefined),
	origin: 'https://noten.example.org',
	since: Date.parse('2026-09-01')
});

describe('feedEvents', () => {
	it('keeps the member’s orchestras and recent dates', () => {
		expect(feed.map((e) => e.uid)).toEqual(['probe@sheetmanagement', 'konzert@sheetmanagement']);
	});

	it('marks the own answer and says what’s rehearsed, with links back', () => {
		expect(feed[0].title).toBe('✓ Probe');
		expect(feed[0].description).toBe(
			[
				'Geprobt: Egmont, Morgenstimmung',
				'Deine Antwort: Zusage',
				'',
				'Details: https://noten.example.org/kalender/probe',
				'Deine Noten: https://noten.example.org/meine-noten?probe=probe'
			].join('\n')
		);
	});

	it('names a concert’s programme and leaves the title alone without an answer', () => {
		expect(feed[1].title).toBe('Herbstkonzert');
		expect(feed[1].description?.split('\n')[0]).toBe('Programm: Egmont');
		expect(feed[1].description).toContain('meine-noten?konzert=konzert');
	});
});
