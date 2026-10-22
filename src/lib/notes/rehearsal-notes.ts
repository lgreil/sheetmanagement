import { LAYOUT, readTable, type ColumnKey, type Table } from '#lib/repertoire/sheet.ts';

/**
 * Notes after a rehearsal ("Probennotizen", #145): what was rehearsed, what to practise and
 * what comes next, for those who missed it. One row per rehearsal, by calendar event id;
 * "Probe" only keeps the sheet readable. The tab is optional; the first note creates it.
 */

export type RehearsalNoteTable = Table<ColumnKey<'rehearsalNotes'> & string>;

export interface RehearsalNote {
	row: number;
	eventId: string;
	done: string;
	practise: string;
	next: string;
	by: string;
	at: string;
}

export interface RehearsalNotes {
	/** Per calendar event id; a rehearsal entered twice keeps its last row. */
	byEvent: Map<string, RehearsalNote>;
	table: RehearsalNoteTable;
}

export function buildRehearsalNotes(values: string[][]): RehearsalNotes {
	const table = readTable(values, LAYOUT.rehearsalNotes.columns);
	const byEvent = new Map<string, RehearsalNote>();
	for (const { row, values: v } of table.rows) {
		if (!v.eventId || !(v.done || v.practise || v.next)) continue;
		byEvent.set(v.eventId, { row, eventId: v.eventId, done: v.done, practise: v.practise, next: v.next, by: v.by, at: v.at });
	}
	return { byEvent, table };
}

export const MAX_FIELD = 1000;
export const NOTE_FIELDS = ['done', 'practise', 'next'] as const;
export type NoteField = (typeof NOTE_FIELDS)[number];
export type NoteInput = Record<NoteField, string>;

/** Trimmed fields; null when one is too long. All empty is allowed: it clears the note. */
export function checkRehearsalNote(input: NoteInput): NoteInput | null {
	const values = {} as NoteInput;
	for (const field of NOTE_FIELDS) {
		const text = input[field].replace(/\r\n/g, '\n').trim();
		if (text.length > MAX_FIELD) return null;
		values[field] = text;
	}
	return values;
}

export const isEmptyNote = (note: NoteInput) => NOTE_FIELDS.every((field) => !note[field]);

/**
 * The rehearsal whose note members should see now: the latest one that is over, until the
 * next one is. An older note would be out of date, so a last rehearsal without a note shows
 * none. `rehearsals` in date order.
 */
export function currentRehearsalNote<E extends { id: string; daysUntil: number; past: boolean }>(
	rehearsals: E[],
	notes: Map<string, RehearsalNote> | undefined
): { event: E; note: RehearsalNote } | null {
	const last = rehearsals.filter((event) => event.past || event.daysUntil < 0).at(-1);
	const note = last && notes?.get(last.id);
	return last && note ? { event: last, note } : null;
}
