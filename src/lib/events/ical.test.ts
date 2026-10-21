import { describe, expect, it } from 'vitest';
import { buildCalendar, escapeText, foldLine, icalDate } from './ical.ts';

describe('escapeText', () => {
	it('escapes what iCalendar reserves', () => {
		expect(escapeText('Aula, Musterschule; Raum 3\nEingang hinten \\ links')).toBe('Aula\\, Musterschule\\; Raum 3\\nEingang hinten \\\\ links');
	});
});

describe('foldLine', () => {
	it('leaves short lines alone', () => {
		expect(foldLine('SUMMARY:Probe')).toBe('SUMMARY:Probe');
	});

	it('folds at 75 bytes without splitting umlauts', () => {
		const line = `DESCRIPTION:${'ü'.repeat(60)}`;
		const folded = foldLine(line);
		const parts = folded.split('\r\n ');
		expect(parts.length).toBeGreaterThan(1);
		for (const [i, part] of parts.entries()) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(i ? 74 : 75);
		expect(parts.join('')).toBe(line);
	});
});

describe('icalDate', () => {
	it('writes UTC times and plain dates', () => {
		expect(icalDate('2026-11-15T17:00:00+01:00', false)).toBe('20261115T160000Z');
		expect(icalDate('2026-11-15', true)).toBe('20261115');
	});
});

describe('buildCalendar', () => {
	it('makes a calendar with one event per entry', () => {
		const ics = buildCalendar(
			'Musterorchester',
			[
				{
					uid: 'abc@noten',
					title: '✓ Probe',
					start: '2026-10-25T08:00:00Z',
					end: '2026-10-25T11:00:00Z',
					allDay: false,
					location: 'Aula, Musterschule',
					description: 'Geprobt: Egmont',
					url: 'https://noten.example.org/konzerte/abc'
				},
				{ uid: 'wochenende@noten', title: 'Probenwochenende', start: '2026-11-28', end: '2026-11-30', allDay: true, tentative: true }
			],
			new Date('2026-10-21T12:00:00Z')
		);
		expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
		expect(ics).toContain('DTSTART:20261025T080000Z\r\n');
		expect(ics).toContain('LOCATION:Aula\\, Musterschule\r\n');
		expect(ics).toContain('DTSTART;VALUE=DATE:20261128\r\n');
		expect(ics).toContain('STATUS:TENTATIVE\r\n');
		expect(ics).toContain('DTSTAMP:20261021T120000Z\r\n');
		expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
		expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
	});
});
