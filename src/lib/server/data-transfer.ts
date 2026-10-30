import { LAYOUT, normalize, readTable, type TabKey } from '#lib/repertoire/sheet.ts';
import { toSheetRow } from '#lib/repertoire/link.ts';
import { dataState, forgetDataState, gridOf } from './data-source.ts';
import { getStore } from './db/index.ts';
import { batchUpdate, clearValues, getTabs, getValues, tabRange, updateValues } from './google/sheets.ts';
import { getRepertoire, readSheetGrids } from './repertoire.ts';
import { getGoogle, requireSetting } from './services.ts';
import { withSheetLock } from './sheet-lock.ts';

/**
 * Moving the data between the sheet and D1 (#186). The import reads every tab once, checks it
 * and replaces everything in D1 in one transaction, which also makes D1 the source. From then
 * on the export writes D1 back into the sheet every night, as a copy to read and print and as
 * a backup outside Cloudflare. "Zurück zur Tabelle" exports once more and makes the sheet the
 * source again, so the move can be undone.
 */

export interface TabPlan {
	key: TabKey;
	tab: string;
	rows: number;
	/** Columns the tab has that the app doesn't know: they aren't imported. */
	unknown: string[];
	/** Columns the app knows that the tab lacks: empty after the import. */
	missing: string[];
}

export interface ImportPlan {
	tabs: TabPlan[];
	rows: number;
}

const columnsOf = (key: TabKey) => LAYOUT[key].columns as Record<string, string>;

function target() {
	return { client: getGoogle().client, spreadsheetId: requireSetting('REPERTOIRE_SHEET_ID') };
}

/** Rows of every tab by column key, read from the sheet now. */
async function readSheetRecords() {
	const { client, spreadsheetId } = target();
	const grids = await readSheetGrids(client, spreadsheetId);
	return (Object.entries(grids) as [TabKey, string[][]][]).map(([key, grid]) => {
		const table = readTable(grid, columnsOf(key));
		const known = new Set(Object.values(columnsOf(key)).map(normalize));
		const rows = table.rows.map((row) => Object.fromEntries(Object.entries(row.values).filter(([, value]) => value)) as Record<string, string>);
		return {
			plan: {
				key,
				tab: LAYOUT[key].tab,
				rows: rows.length,
				unknown: (grid[0] ?? []).filter((name) => name.trim() && !known.has(normalize(name))),
				missing: table.missing.map((column) => columnsOf(key)[column])
			} satisfies TabPlan,
			rows
		};
	});
}

/** What the import would take over, without changing anything. */
export async function planImport(): Promise<ImportPlan> {
	const tabs = (await readSheetRecords()).map(({ plan }) => plan);
	return { tabs, rows: tabs.reduce((sum, tab) => sum + tab.rows, 0) };
}

/** Takes the sheet over into D1 and makes D1 the source. Earlier data in D1 is replaced. */
export async function importFromSheet(): Promise<ImportPlan> {
	// In the lock, so no save to the sheet lands between the read and the switch.
	const tabs = await withSheetLock(async () => {
		const tabs = await readSheetRecords();
		await getStore().importData(Object.fromEntries(tabs.map(({ plan, rows }) => [plan.key, rows])));
		forgetDataState();
		return tabs;
	});
	await getRepertoire({ force: true });
	const plans = tabs.map(({ plan }) => plan);
	return { tabs: plans, rows: plans.reduce((sum, tab) => sum + tab.rows, 0) };
}

/**
 * Writes D1 into the sheet: every tab D1 has, in the sheet's own column order (columns it
 * lacks are added at the end), everything below the header replaced. Values go in as text,
 * so nothing turns into a formula.
 */
export async function exportToSheet(): Promise<{ tabs: number; rows: number }> {
	return withSheetLock(async () => {
		const { client, spreadsheetId } = target();
		const data = await getStore().readData();
		const keys = (Object.keys(data) as TabKey[]).filter((key) => key in LAYOUT);
		const present = new Set((await getTabs(client, spreadsheetId)).map((tab) => tab.title));
		const added = keys.filter((key) => !present.has(LAYOUT[key].tab));
		await batchUpdate(
			client,
			spreadsheetId,
			added.map((key) => ({ addSheet: { properties: { title: LAYOUT[key].tab, gridProperties: { frozenRowCount: 1 } } } }))
		);

		const headerRanges = keys.map((key) => tabRange(LAYOUT[key].tab, '1:1'));
		const headers = await getValues(client, spreadsheetId, headerRanges);
		const writes = keys.map((key, i) => {
			const header = [...(headers[headerRanges[i]]?.[0] ?? [])];
			const table = readTable([header], columnsOf(key));
			for (const column of table.missing) {
				table.indexes[column] = header.length;
				header.push(columnsOf(key)[column]);
			}
			const rows = gridOf(key, data[key]).slice(1).map((cells) => {
				const values = Object.fromEntries(Object.keys(columnsOf(key)).map((column, j) => [column, cells[j]]));
				const row = toSheetRow(values, table.indexes);
				return [...row, ...Array(Math.max(0, header.length - row.length)).fill('')];
			});
			return { range: tabRange(LAYOUT[key].tab, 'A1'), values: [header, ...rows] };
		});
		await clearValues(client, spreadsheetId, keys.map((key) => tabRange(LAYOUT[key].tab, 'A2:ZZ')));
		await updateValues(client, spreadsheetId, writes);
		return { tabs: keys.length, rows: writes.reduce((sum, write) => sum + write.values.length - 1, 0) };
	});
}

/** Makes the sheet the source again, after one last export so it has everything. */
export async function backToSheet(): Promise<{ tabs: number; rows: number }> {
	const exported = await exportToSheet();
	await getStore().setDataSource('sheet');
	forgetDataState();
	await getRepertoire({ force: true });
	return exported;
}

/** Everything people maintain, by tab and column key, from wherever it lives; for the admins' download. */
export async function allData(): Promise<{ source: 'sheet' | 'd1'; tabs: Record<string, Record<string, string>[]> }> {
	const { source } = await dataState({ force: true });
	if (source === 'd1') {
		const data = await getStore().readData();
		return { source, tabs: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.map((row) => row.cells)])) };
	}
	return { source, tabs: Object.fromEntries((await readSheetRecords()).map(({ plan, rows }) => [plan.key, rows])) };
}
