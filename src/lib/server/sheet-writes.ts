import { toSheetRow } from '#lib/repertoire/link.ts';
import { LAYOUT, readTable, type ColumnKey, type Table, type TabKey } from '#lib/repertoire/sheet.ts';
import { appendRows, batchUpdate, columnLetter, getTabs, getValues, tabRange, updateValues } from './google/sheets.ts';
import { getRepertoire } from './repertoire.ts';
import { getGoogle, requireSetting } from './services.ts';

/**
 * Changes the app makes to the sheet on someone's behalf (programme editor, admin
 * page). Every change starts from a fresh read, never from the cache, so row numbers
 * are current.
 */

export class SheetLayoutError extends Error {
	constructor(readonly tab: string, readonly columns: string[] = []) {
		super(columns.length ? `Im Blatt „${tab}“ fehlen Spalten: ${columns.join(', ')}.` : `Das Blatt „${tab}“ fehlt.`);
		this.name = 'SheetLayoutError';
	}
}

type Columns<K extends TabKey> = ColumnKey<K> & string;

function target() {
	return { client: getGoogle().client, spreadsheetId: requireSetting('REPERTOIRE_SHEET_ID') };
}

/** One tab, read now. Throws SheetLayoutError if the tab doesn't exist. */
export async function readTab<K extends TabKey>(key: K): Promise<Table<Columns<K>>> {
	const { client, spreadsheetId } = target();
	const tab = LAYOUT[key].tab;
	if (!(await getTabs(client, spreadsheetId)).some((t) => t.title === tab)) throw new SheetLayoutError(tab);
	const range = tabRange(tab);
	const values = (await getValues(client, spreadsheetId, [range]))[range];
	return readTable(values, LAYOUT[key].columns as Record<Columns<K>, string>);
}

/** Appends rows in the tab's own column order. Values for columns the tab lacks would be lost, so that throws. */
export async function appendRecords<K extends TabKey>(
	key: K,
	table: Table<Columns<K>>,
	records: Partial<Record<Columns<K>, string>>[]
): Promise<void> {
	if (records.length === 0) return;
	const needed = [...new Set(records.flatMap((record) => Object.keys(record).filter((k) => record[k as Columns<K>])))];
	const missing = needed.filter((column) => table.missing.includes(column as Columns<K>));
	if (missing.length) {
		const names = LAYOUT[key].columns as Record<string, string>;
		throw new SheetLayoutError(LAYOUT[key].tab, missing.map((column) => names[column]));
	}
	const { client, spreadsheetId } = target();
	await appendRows(client, spreadsheetId, tabRange(LAYOUT[key].tab), records.map((record) => toSheetRow(record, table.indexes)));
}

/** Overwrites some cells of one row (1-based sheet row number from a fresh readTab). */
export function updateRecord<K extends TabKey>(
	key: K,
	table: Table<Columns<K>>,
	row: number,
	values: Partial<Record<Columns<K>, string>>
): Promise<void> {
	return updateRecords(key, table, [{ row, values }]);
}

/** Overwrites cells in several rows in one request, e.g. a renamed piece in every programme. */
export async function updateRecords<K extends TabKey>(
	key: K,
	table: Table<Columns<K>>,
	updates: { row: number; values: Partial<Record<Columns<K>, string>> }[]
): Promise<void> {
	if (updates.length === 0) return;
	const columns = [...new Set(updates.flatMap((update) => Object.keys(update.values) as Columns<K>[]))];
	const missing = columns.filter((column) => table.indexes[column] === undefined);
	if (missing.length) {
		const names = LAYOUT[key].columns as Record<string, string>;
		throw new SheetLayoutError(LAYOUT[key].tab, missing.map((column) => names[column]));
	}
	const { client, spreadsheetId } = target();
	await updateValues(
		client,
		spreadsheetId,
		updates.flatMap(({ row, values }) =>
			(Object.keys(values) as Columns<K>[]).map((column) => ({
				range: tabRange(LAYOUT[key].tab, `${columnLetter(table.indexes[column]!)}${row}`),
				values: [[values[column] ?? '']]
			}))
		)
	);
}

/** Deletes whole rows (1-based sheet row numbers), bottom-up so the numbers stay valid. */
export async function deleteRows(key: TabKey, rows: number[]): Promise<void> {
	if (rows.length === 0) return;
	const { client, spreadsheetId } = target();
	const tab = (await getTabs(client, spreadsheetId)).find((t) => t.title === LAYOUT[key].tab);
	if (!tab) throw new SheetLayoutError(LAYOUT[key].tab);
	const sorted = [...new Set(rows)].filter((row) => row > 1).sort((a, b) => b - a);
	await batchUpdate(
		client,
		spreadsheetId,
		sorted.map((row) => ({
			deleteDimension: { range: { sheetId: tab.sheetId, dimension: 'ROWS', startIndex: row - 1, endIndex: row } }
		}))
	);
}

/**
 * Overwrites everything below the header of a generated tab in one request. `rows`
 * come from a fresh read of that tab and must be padded to its old length, so rows
 * that went away are cleared.
 */
export async function replaceRows(key: TabKey, rows: (string | boolean)[][]): Promise<void> {
	if (rows.length === 0) return;
	const { client, spreadsheetId } = target();
	const width = Math.max(...rows.map((row) => row.length));
	const range = tabRange(LAYOUT[key].tab, `A2:${columnLetter(width - 1)}${rows.length + 1}`);
	await updateValues(client, spreadsheetId, [{ range, values: rows }]);
}

/** Re-reads the sheet so the next page shows the change. */
export async function refreshAfterWrite(): Promise<void> {
	await getRepertoire({ force: true });
}
