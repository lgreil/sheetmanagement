import { normalizeEmail } from '#lib/access/access.ts';
import { isDone } from '#lib/repertoire/missing-parts.ts';
import { LAYOUT, readTable, type ColumnKey, type Table } from '#lib/repertoire/sheet.ts';

/**
 * Who actually came to a rehearsal ("Anwesenheit", #120): one row per rehearsal and
 * person, "Anwesend" a checkbox. Personal data, so it's kept to this, and only the person
 * themselves and those with "anwesenheit.erfassen" see it. The tab is optional.
 */

export type AttendanceTable = Table<ColumnKey<'attendance'> & string>;

export interface AttendanceEntry {
	row: number;
	email: string;
	name: string;
	present: boolean;
}

export interface Attendance {
	/** Per calendar event id, one entry per email (the last row wins). */
	byEvent: Map<string, Map<string, AttendanceEntry>>;
	table: AttendanceTable;
}

export function buildAttendance(values: string[][]): Attendance {
	const table = readTable(values, LAYOUT.attendance.columns);
	const byEvent = new Map<string, Map<string, AttendanceEntry>>();
	for (const { row, values: v } of table.rows) {
		const email = normalizeEmail(v.who);
		if (!v.eventId || !email) continue;
		const event = byEvent.get(v.eventId) ?? new Map<string, AttendanceEntry>();
		event.set(email, { row, email, name: v.name || email, present: isDone(v.present) });
		byEvent.set(v.eventId, event);
	}
	return { byEvent, table };
}

/** The rows of one rehearsal as they are; the editor sends it back to notice edits made meanwhile. */
export function attendanceVersion(table: AttendanceTable, eventId: string): string {
	return JSON.stringify(
		table.rows
			.filter((row) => row.values.eventId === eventId)
			.map(({ values: v }) => [normalizeEmail(v.who), isDone(v.present)].join('\n'))
			.sort()
	);
}

export interface AttendanceTick {
	email: string;
	name: string;
	present: boolean;
}

const MAX_PEOPLE = 300;

/** What the browser sent, checked against the people the page offered; null if it doesn't fit. */
export function parseTicks(json: string, offered: Map<string, string>): AttendanceTick[] | null {
	let value: unknown;
	try {
		value = JSON.parse(json);
	} catch {
		return null;
	}
	if (!Array.isArray(value) || value.length > MAX_PEOPLE) return null;
	const ticks = new Map<string, AttendanceTick>();
	for (const item of value) {
		if (!item || typeof item !== 'object') return null;
		const { email, present } = item as Record<string, unknown>;
		const key = typeof email === 'string' ? normalizeEmail(email) : '';
		if (!offered.has(key) || typeof present !== 'boolean') return null;
		ticks.set(key, { email: key, name: offered.get(key)!, present });
	}
	return [...ticks.values()];
}

/**
 * Rows to change, add and remove so the rehearsal has one row per ticked-off person.
 * People the form didn't send keep their rows; rows entered twice lose the extras.
 */
export function planAttendanceSave(table: AttendanceTable, eventId: string, label: string, ticks: AttendanceTick[]) {
	const rows = table.rows.filter((row) => row.values.eventId === eventId);
	const update: { row: number; values: { present: boolean; name: string } }[] = [];
	const append: { event: string; who: string; name: string; present: boolean; eventId: string }[] = [];
	const remove: number[] = [];
	for (const tick of ticks) {
		const own = rows.filter((row) => normalizeEmail(row.values.who) === tick.email);
		const last = own.at(-1);
		if (!last) append.push({ event: label, who: tick.email, name: tick.name, present: tick.present, eventId });
		else if (isDone(last.values.present) !== tick.present) update.push({ row: last.row, values: { present: tick.present, name: last.values.name || tick.name } });
		remove.push(...own.slice(0, -1).map((row) => row.row));
	}
	return { update, append, remove };
}

export interface MemberAttendance {
	email: string;
	/** Rehearsals with attendance taken that the person came to. */
	present: number;
	/** Rehearsals with attendance taken. */
	of: number;
	/** Per piece name (normalised by the caller): came / rehearsals with that piece planned and attendance taken. */
	pieces: Map<string, { present: number; of: number }>;
}

/**
 * Per member, over a concert's rehearsals that have attendance taken: how many they came
 * to, overall and per planned piece. People with no row for a rehearsal count as absent
 * there, if the rehearsal has any rows at all.
 */
export function attendanceSummary(
	attendance: Attendance,
	rehearsalIds: string[],
	emails: string[],
	planned: (eventId: string) => string[]
): { taken: number; members: MemberAttendance[] } {
	const taken = rehearsalIds.filter((id) => attendance.byEvent.get(id)?.size);
	const members = emails.map((email) => {
		const result: MemberAttendance = { email, present: 0, of: taken.length, pieces: new Map() };
		for (const id of taken) {
			const came = !!attendance.byEvent.get(id)?.get(email)?.present;
			if (came) result.present++;
			for (const piece of planned(id)) {
				const count = result.pieces.get(piece) ?? { present: 0, of: 0 };
				count.of++;
				if (came) count.present++;
				result.pieces.set(piece, count);
			}
		}
		return result;
	});
	return { taken: taken.length, members };
}
