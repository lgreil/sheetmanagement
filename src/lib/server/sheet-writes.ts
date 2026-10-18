import { toSheetRow } from '#lib/repertoire/link.ts';
import { LAYOUT, readTable, type ColumnKey, type Table, type TabKey } from '#lib/repertoire/sheet.ts';
import { appendRows, batchUpdate, getTabs, getValues, tabRange } from './google/sheets.ts';
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

/** Re-reads the sheet so the next page shows the change. */
export async function refreshAfterWrite(): Promise<void> {
	await getRepertoire({ force: true });
}
