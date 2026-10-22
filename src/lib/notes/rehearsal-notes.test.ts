import { describe, expect, it } from 'vitest';
import { LAYOUT } from '#lib/repertoire/sheet.ts';
import { buildRehearsalNotes, checkRehearsalNote, currentRehearsalNote, isEmptyNote } from './rehearsal-notes.ts';

const header = Object.values(LAYOUT.rehearsalNotes.columns);

describe('buildRehearsalNotes', () => {
	it('keeps one note per rehearsal, the last row winning, and skips empty rows', () => {
		const { byEvent } = buildRehearsalNotes([
			header,
			['Probe 1', 'Egmont', '', '', 'David', '2026-10-01', 'p1'],
			['Probe 1', 'Egmont bis Takt 120', 'ab B', 'Nachtmusik', 'David', '2026-10-02', 'p1'],
			['Probe 2', '', '', '', 'David', '2026-10-09', 'p2'],
			['Probe 3', 'Bolero', '', '', '', '', '']
		]);
		expect([...byEvent.keys()]).toEqual(['p1']);
		expect(byEvent.get('p1')).toMatchObject({ row: 3, done: 'Egmont bis Takt 120', practise: 'ab B', next: 'Nachtmusik' });
	});
});

describe('checkRehearsalNote', () => {
	it('trims the fields and refuses one that is too long', () => {
		expect(checkRehearsalNote({ done: ' a \r\n b ', practise: '', next: 'c' })).toEqual({ done: 'a \n b', practise: '', next: 'c' });
		expect(checkRehearsalNote({ done: 'x'.repeat(1001), practise: '', next: '' })).toBeNull();
	});

	it('knows an empty note', () => {
		expect(isEmptyNote({ done: '', practise: '', next: '' })).toBe(true);
		expect(isEmptyNote({ done: '', practise: 'a', next: '' })).toBe(false);
	});
});

describe('currentRehearsalNote', () => {
	const note = (eventId: string) => ({ row: 2, eventId, done: 'x', practise: '', next: '', by: '', at: '' });
	const events = [
		{ id: 'a', daysUntil: -10, past: true },
		{ id: 'b', daysUntil: -3, past: true },
		{ id: 'c', daysUntil: 0, past: false },
		{ id: 'd', daysUntil: 4, past: false }
	];

	it('shows the note of the last rehearsal that is over', () => {
		expect(currentRehearsalNote(events, new Map([['b', note('b')]]))?.event.id).toBe('b');
	});

	it('shows nothing when the last rehearsal has no note, not an older one', () => {
		expect(currentRehearsalNote(events, new Map([['a', note('a')]]))).toBeNull();
		expect(currentRehearsalNote(events, undefined)).toBeNull();
	});

	it('takes today’s rehearsal once it is over', () => {
		const over = events.map((event) => (event.id === 'c' ? { ...event, past: true } : event));
		expect(currentRehearsalNote(over, new Map([['c', note('c')]]))?.event.id).toBe('c');
	});
});
