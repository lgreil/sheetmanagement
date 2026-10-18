import { t } from '#lib/i18n/index.ts';
import type { Part, PartStatus } from '#lib/music/types.ts';
import { LAYOUT, readTable } from './sheet.ts';

/**
 * The "Fehlende Stimmen" tab: a generated mirror of the gaps in the archive's file
 * names. The app rewrites it; people only tick "erledigt".
 */

export type GapStatus = Exclude<PartStatus, 'ok'>;

export interface Gap {
	fileId: string;
	piece: string;
	part: string;
	status: GapStatus;
}

/** Parts that count as a gap. Recordings and "sonstiges" files aren't parts anyone plays from. */
export const isGap = (part: Pick<Part, 'status' | 'kind'>) =>
	part.status !== 'ok' && part.kind !== 'audio' && part.kind !== 'sonstiges';

/** Every gap in the archive, in archive order. The title can come from the sheet, which may correct it. */
export function archiveGaps(
	pieces: { id: string; title: string; parts: Pick<Part, 'id' | 'label' | 'status' | 'kind'>[] }[],
	titleOf: (pieceId: string) => string | undefined = () => undefined
): Gap[] {
	return pieces.flatMap((piece) =>
		piece.parts.filter(isGap).map((part) => ({
			fileId: part.id,
			piece: titleOf(piece.id) || piece.title,
			part: part.label,
			status: part.status as GapStatus
		}))
	);
}

/** Checkbox cells read as TRUE (or WAHR in a German sheet); people may also type x or ja. */
export function isDone(value: string): boolean {
	return ['true', 'wahr', 'x', 'ja', '1', 'erledigt'].includes(value.trim().toLowerCase());
}

const COLUMNS = LAYOUT.missingParts.columns;
type Column = keyof typeof COLUMNS;

/** File ids ticked "erledigt" in the tab as it is, for when there's no sync. */
export function doneFileIds(values: string[][]): string[] {
	return readTable(values, COLUMNS)
		.rows.filter((row) => row.values.fileId && isDone(row.values.done))
		.map((row) => row.values.fileId);
}

export type Cell = string | boolean;

export interface MissingPartsPlan {
	/** False when the tab lacks a column the sync needs; nothing should be written then. */
	ok: boolean;
	added: Gap[];
	/** Sheet rows (1-based) whose gap is gone, or that repeat a file id. */
	removed: number[];
	kept: { row: number; gap: Gap; done: boolean }[];
	/** Whether the tab differs from the archive, i.e. whether `body` needs writing. */
	changed: boolean;
	/** Everything below the header, padded with empty rows to clear rows that went away. */
	body: Cell[][];
	/** File ids ticked "erledigt" after the sync. */
	done: string[];
}

/**
 * Compares the tab (raw values, header included) with the archive's gaps. Rows that
 * stay keep their place, their "erledigt" and any extra columns; new gaps go below.
 */
export function planMissingParts(values: string[][], gaps: Gap[]): MissingPartsPlan {
	const table = readTable(values, COLUMNS);
	if (table.missing.length) return { ok: false, added: [], removed: [], kept: [], changed: false, body: [], done: doneFileIds(values) };

	const byId = new Map(gaps.map((gap) => [gap.fileId, gap]));
	const seen = new Set<string>();
	const removed: number[] = [];
	const kept: MissingPartsPlan['kept'] = [];
	let changed = false;
	for (const { row, values: cells } of table.rows) {
		const gap = byId.get(cells.fileId);
		if (!gap || seen.has(gap.fileId)) {
			removed.push(row);
			continue;
		}
		seen.add(gap.fileId);
		kept.push({ row, gap, done: isDone(cells.done) });
		// A renamed piece or a part that went from FEHLT to UNVOLLSTÄNDIG.
		if (cells.piece !== gap.piece || cells.part !== gap.part || cells.status !== t.piece.partStatus[gap.status]) changed = true;
	}
	const added: Gap[] = [];
	for (const gap of byId.values()) if (!seen.has(gap.fileId)) added.push(gap);
	if (added.length || removed.length) changed = true;

	const indexes = table.indexes as Record<Column, number>;
	const width = Math.max(table.width, ...Object.values<number>(indexes).map((index) => index + 1));
	const toRow = (gap: Gap, done: boolean, original: string[] = []): Cell[] => {
		const cells: Cell[] = Array.from({ length: width }, (_, i) => original[i] ?? '');
		cells[indexes.piece] = gap.piece;
		cells[indexes.part] = gap.part;
		cells[indexes.status] = t.piece.partStatus[gap.status];
		cells[indexes.fileId] = gap.fileId;
		cells[indexes.done] = done;
		return cells;
	};
	const body = [
		...kept.map(({ row, gap, done }) => toRow(gap, done, values[row - 1])),
		...added.map((gap) => toRow(gap, false))
	];
	// Rows that went away are blanked, so the tab doesn't keep stale gaps at the bottom.
	const lastRow = Math.max(1, ...table.rows.map((row) => row.row));
	while (body.length < lastRow - 1) body.push(Array<Cell>(width).fill(''));

	return { ok: true, added, removed, kept, changed, body, done: kept.filter((k) => k.done).map((k) => k.gap.fileId) };
}
