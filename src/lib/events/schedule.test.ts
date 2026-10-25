import { describe, expect, it } from 'vitest';
import { bachkreis } from '#lib/config/presets/bachkreis.ts';
import type { CalendarEvent } from '#lib/server/google/calendar.ts';
import { daysUntil, dateParts } from './format.ts';
import { buildSchedule, classify } from './schedule.ts';

const keywords = bachkreis.events;

const timed = (id: string, title: string, start: string, end: string): CalendarEvent => ({
	id,
	title,
	start,
	end,
	allDay: false
});
const allDay = (id: string, title: string, date: string): CalendarEvent => ({
	id,
	title,
	start: date,
	end: date,
	allDay: true
});

describe('classify', () => {
	it.each([
		['Herbstkonzert', 'konzert'],
		['1. Weihnachtskonzert', 'konzert'],
		['Probe Herbstkonzert 🎶🍂', 'probe'],
		['(?) Generalprobe Herbstkonzert 🎶🍂', 'generalprobe'],
		['Vorstandssitzung', 'sonstiges']
	])('%s → %s', (title, type) => expect(classify(title, keywords)).toBe(type));
});

describe('buildSchedule', () => {
	// The real calendar's shape, autumn 2026.
	const events = [
		allDay('xmas2', '2. Weihnachtskonzert', '2026-12-21'),
		timed('p1', 'Probe Herbstkonzert 🎶🍂', '2026-10-10T10:00:00+02:00', '2026-10-10T13:00:00+02:00'),
		timed('p2', 'Probe Herbstkonzert 🎶🍂', '2026-11-07T10:00:00+01:00', '2026-11-07T13:00:00+01:00'),
		timed('gp', '(?) Generalprobe Herbstkonzert 🎶🍂', '2026-11-14T10:00:00+01:00', '2026-11-14T12:00:00+01:00'),
		allDay('autumn', 'Herbstkonzert', '2026-11-15'),
		allDay('xmas1', '1. Weihnachtskonzert', '2026-12-18'),
		timed('px', 'Probe', '2026-12-05T10:00:00+01:00', '2026-12-05T13:00:00+01:00')
	];
	const schedule = buildSchedule(events, keywords);
	const byId = new Map(schedule.map((event) => [event.id, event]));

	it('sorts by date and marks tentative events', () => {
		expect(schedule.map((e) => e.id)).toEqual(['p1', 'p2', 'gp', 'autumn', 'px', 'xmas1', 'xmas2']);
		expect(byId.get('gp')).toMatchObject({ tentative: true, displayTitle: 'Generalprobe Herbstkonzert 🎶🍂' });
	});

	it('links rehearsals to the concert named in their title', () => {
		expect(byId.get('autumn')?.rehearsalIds).toEqual(['p1', 'p2', 'gp']);
		expect(byId.get('gp')?.concertId).toBe('autumn');
	});

	it('reads the orchestras a rehearsal’s title names, not a concert’s', () => {
		const shared = buildSchedule(
			[...events, timed('pa', 'Probe Herbstkonzert (A)', '2026-10-20T18:00:00+02:00', '2026-10-20T21:00:00+02:00'), allDay('ka', 'Konzert A', '2026-11-20')],
			keywords,
			['EO', 'A']
		);
		const of = new Map(shared.map((event) => [event.id, event]));
		expect(of.get('pa')).toMatchObject({ orchestra: 'A', concertId: 'autumn' });
		expect(of.get('p1')?.orchestra).toBeUndefined();
		expect(of.get('ka')?.orchestra).toBeUndefined();
	});

	it('falls back to the next concert when the title names none', () => {
		expect(byId.get('px')?.concertId).toBe('xmas1');
		expect(byId.get('xmas2')?.rehearsalIds).toEqual([]);
	});
});

describe('date formatting', () => {
	it('keeps all-day dates on their day and shows local times', () => {
		const parts = dateParts(allDay('a', 'x', '2026-11-15'), 'de-DE', 'Europe/Berlin');
		expect(parts).toMatchObject({ day: '15', time: '', monthKey: '2026-11' });
		// "So" or "So." depending on the ICU version.
		expect(parts.weekday).toMatch(/^So/);
		expect(
			dateParts(timed('b', 'x', '2026-11-07T09:00:00Z', '2026-11-07T12:00:00Z'), 'de-DE', 'Europe/Berlin').time
		).toBe('10:00 – 13:00');
	});

	it('counts days in the orchestra time zone', () => {
		const now = Date.parse('2026-11-14T23:30:00Z'); // already 15 Nov, 00:30 in Berlin
		expect(daysUntil(allDay('a', 'x', '2026-11-15'), now, 'Europe/Berlin')).toBe(0);
		expect(daysUntil(allDay('a', 'x', '2026-11-18'), now, 'Europe/Berlin')).toBe(3);
	});
});
