import { LAYOUT, normalize, readTable, type ColumnKey, type Table } from '#lib/repertoire/sheet.ts';

/**
 * The rehearsal plan ("Proben", #65): which pieces are rehearsed at which rehearsal. One
 * row per rehearsal and piece. "Probe" only keeps the sheet readable; the app goes by the
 * calendar event id. The tab is optional; without it the pages just show no plan.
 */

export type RehearsalTable = Table<ColumnKey<'rehearsals'> & string>;

export interface PlannedPiece {
	row: number;
	/** The name as entered, matched against "Stücke" by the pages. */
	pieceName: string;
	notes?: string;
}

export interface RehearsalPlan {
	/** Per calendar event id, in row order; a piece entered twice counts once. */
	byEvent: Map<string, PlannedPiece[]>;
	table: RehearsalTable;
}

export function buildRehearsalPlan(values: string[][]): RehearsalPlan {
	const table = readTable(values, LAYOUT.rehearsals.columns);
	const byEvent = new Map<string, PlannedPiece[]>();
	for (const { row, values: v } of table.rows) {
		if (!v.eventId || !v.piece) continue;
		const list = byEvent.get(v.eventId) ?? [];
		if (list.some((entry) => normalize(entry.pieceName) === normalize(v.piece))) continue;
		list.push({ row, pieceName: v.piece, notes: v.notes || undefined });
		byEvent.set(v.eventId, list);
	}
	return { byEvent, table };
}

/** What the editor sends: per rehearsal (event id), the names of the pieces to rehearse. */
export type PlanEdit = Record<string, string[]>;

const MAX_REHEARSALS = 60;
const MAX_PIECES = 100;
const MAX_LENGTH = 300;

/** Checks what the browser sent against the rehearsals it may change; null if it doesn't fit. */
export function parsePlanEdit(json: string, rehearsalIds: Set<string>): PlanEdit | null {
	let value: unknown;
	try {
		value = JSON.parse(json);
	} catch {
		return null;
	}
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	const entries = Object.entries(value);
	if (entries.length > MAX_REHEARSALS) return null;
	const edit: PlanEdit = {};
	for (const [id, pieces] of entries) {
		if (!rehearsalIds.has(id) || !Array.isArray(pieces) || pieces.length > MAX_PIECES) return null;
		if (!pieces.every((piece) => typeof piece === 'string' && piece.trim())) return null;
		edit[id] = [...new Set((pieces as string[]).map((piece) => piece.trim().slice(0, MAX_LENGTH)))];
	}
	return edit;
}

const rowsOf = (table: RehearsalTable, ids: string[]) => table.rows.filter((row) => ids.includes(row.values.eventId));

/**
 * The rows of these rehearsals as they are in the sheet. The editor sends this back when
 * saving; if it changed in between, someone else edited the plan.
 */
export function planVersion(table: RehearsalTable, ids: string[]): string {
	return JSON.stringify(
		rowsOf(table, ids)
			.map(({ values: v }) => [v.eventId, normalize(v.piece), v.notes].join('\n'))
			.sort()
	);
}

/**
 * Rows to append and rows to delete so each edited rehearsal has exactly the given pieces.
 * Rows that stay are left alone, so notes written in the sheet survive; pieces entered
 * twice by hand lose their extra rows.
 */
export function planRehearsalSave(table: RehearsalTable, edit: PlanEdit, labels: Record<string, string>) {
	const append: { rehearsal: string; piece: string; eventId: string }[] = [];
	const remove: number[] = [];
	for (const [id, pieces] of Object.entries(edit)) {
		const wanted = new Set(pieces.map(normalize));
		const kept = new Set<string>();
		for (const row of rowsOf(table, [id])) {
			const name = normalize(row.values.piece);
			if (wanted.has(name) && !kept.has(name)) kept.add(name);
			else remove.push(row.row);
		}
		for (const piece of pieces) {
			if (!kept.has(normalize(piece))) append.push({ rehearsal: labels[id] ?? '', piece, eventId: id });
		}
	}
	return { append, remove };
}
