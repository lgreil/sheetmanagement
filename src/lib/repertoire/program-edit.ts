import { normalize, type ColumnKey, type Table } from './sheet.ts';

type ProgramColumns = ColumnKey<'program'> & string;
export type ProgramTable = Table<ProgramColumns>;

/** One line of a programme as the editor sends it. */
export interface EditorEntry {
	/** The piece's name as in the "Stücke" tab (or as typed in the sheet). */
	piece: string;
	notes: string;
}

const MAX_ENTRIES = 100;
const MAX_LENGTH = 300;

/** Checks what the browser sent; null if it isn't a list of entries. */
export function parseEntries(json: string): EditorEntry[] | null {
	let value: unknown;
	try {
		value = JSON.parse(json);
	} catch {
		return null;
	}
	if (!Array.isArray(value) || value.length > MAX_ENTRIES) return null;
	const entries: EditorEntry[] = [];
	for (const item of value) {
		if (!item || typeof item !== 'object') return null;
		const { piece, notes } = item as Record<string, unknown>;
		if (typeof piece !== 'string' || !piece.trim() || (notes !== undefined && typeof notes !== 'string')) return null;
		entries.push({ piece: piece.trim().slice(0, MAX_LENGTH), notes: (notes ?? '').trim().slice(0, MAX_LENGTH) });
	}
	return entries;
}

const rowsOf = (table: ProgramTable, concert: string) =>
	table.rows.filter((row) => normalize(row.values.concert) === normalize(concert));

/**
 * The concert's programme rows as they are in the sheet. The editor sends this back
 * when saving; if the sheet changed in between, someone else edited the programme.
 */
export function programVersion(table: ProgramTable, concert: string): string {
	return JSON.stringify(
		rowsOf(table, concert).map(({ values: v }) => [v.position, v.piece, v.notes])
	);
}

/** Rows to append (numbered 1, 2, 3 …) and the concert's old rows to delete afterwards. */
export function planProgramSave(table: ProgramTable, concert: string, entries: EditorEntry[]) {
	return {
		append: entries.map((entry, i) => ({ concert, position: String(i + 1), piece: entry.piece, notes: entry.notes })),
		remove: rowsOf(table, concert).map((row) => row.row)
	};
}
