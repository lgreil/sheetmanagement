import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LAYOUT, readTable } from '#lib/repertoire/sheet.ts';
import { memoryStore } from './db/memory.ts';
import { demoClient, resetDemo } from './demo/backend.ts';
import { DEMO_IDS } from './demo/data.ts';
import { getValues, tabRange } from './google/sheets.ts';

/** The whole move (#186) against the demo's stand-in for Google and the memory store. */

let store = memoryStore();
vi.mock('./db/index.ts', () => ({ getStore: () => store }));
vi.mock('./services.ts', () => ({ getGoogle: () => ({ client: demoClient() }), requireSetting: () => DEMO_IDS.sheet, NotConfiguredError: class extends Error {} }));
vi.mock('./repertoire.ts', async (original) => ({ ...(await original<typeof import('./repertoire.ts')>()), getRepertoire: vi.fn(async () => ({ ok: false })) }));

const { forgetDataState } = await import('./data-source.ts');
const { appendRecords, deleteRows, readTab, replaceRows, updateRecord } = await import('./sheet-writes.ts');
const { backToSheet, changedSinceExport, exportToSheet, importFromSheet, planImport } = await import('./data-transfer.ts');

const sheetPieces = async () => {
	const range = tabRange(LAYOUT.pieces.tab);
	return readTable((await getValues(demoClient(), DEMO_IDS.sheet, [range]))[range], LAYOUT.pieces.columns).rows.map((row) => row.values);
};

beforeEach(() => {
	resetDemo();
	store = memoryStore();
	forgetDataState();
});

describe('moving the data into D1', () => {
	it('shows what it would take over without changing anything', async () => {
		const plan = await planImport();
		const pieces = plan.tabs.find((tab) => tab.key === 'pieces')!;
		expect(pieces.rows).toBe((await sheetPieces()).length);
		expect(plan.rows).toBeGreaterThan(pieces.rows);
		expect((await store.dataState()).source).toBe('sheet');
	});

	it('takes the sheet over, so reads come from D1 with the same rows', async () => {
		const before = await sheetPieces();
		await importFromSheet();
		expect((await store.dataState()).source).toBe('d1');
		expect((await readTab('pieces')).rows.map((row) => row.values)).toEqual(before);
	});

	it('saves into D1 with the same functions, finding rows by content', async () => {
		await importFromSheet();
		let pieces = await readTab('pieces');
		const [first, second] = pieces.rows;
		await updateRecord('pieces', pieces, second.row, { notes: 'Neu eingerichtet' });
		await deleteRows('pieces', pieces, [first.row]);
		pieces = await readTab('pieces');
		await appendRecords('pieces', pieces, [{ title: 'Finlandia', composer: 'Sibelius' }]);

		const now = (await readTab('pieces')).rows.map((row) => row.values);
		expect(now).toHaveLength(pieces.rows.length + 1);
		expect(now[0]).toMatchObject({ title: second.values.title, notes: 'Neu eingerichtet' });
		expect(now.at(-1)).toMatchObject({ title: 'Finlandia', composer: 'Sibelius' });
		// The sheet isn't touched until the export.
		expect((await sheetPieces())[0].title).toBe(first.values.title);
	});

	it('refuses a save to a row someone else changed meanwhile', async () => {
		await importFromSheet();
		const pieces = await readTab('pieces');
		await updateRecord('pieces', pieces, pieces.rows[0].row, { notes: 'eins' });
		await expect(updateRecord('pieces', pieces, pieces.rows[0].row, { notes: 'zwei' })).rejects.toMatchObject({ status: 409 });
	});

	it('replaces a generated tab without its padding', async () => {
		await importFromSheet();
		const columns = Object.keys(LAYOUT.missingParts.columns);
		const row = columns.map((column) => (column === 'fileId' ? 'f1' : column === 'done' ? true : ''));
		await replaceRows('missingParts', [row, columns.map(() => '')]);
		expect((await store.readData(['missingParts'])).missingParts.map((r) => r.cells)).toEqual([{ fileId: 'f1', done: 'TRUE' }]);
	});

	it('knows whether anything changed since the last export', async () => {
		await importFromSheet();
		expect(await changedSinceExport()).toBe(true);
		await exportToSheet();
		expect(await changedSinceExport()).toBe(false);
		const pieces = await readTab('pieces');
		await updateRecord('pieces', pieces, pieces.rows[0].row, { notes: 'geändert' });
		expect(await changedSinceExport()).toBe(true);
	});

	it('writes D1 back into the sheet, and can make the sheet the source again', async () => {
		await importFromSheet();
		const pieces = await readTab('pieces');
		await updateRecord('pieces', pieces, pieces.rows[0].row, { notes: 'Aus D1' });
		const exported = await exportToSheet();
		expect(exported.rows).toBeGreaterThan(0);
		expect((await sheetPieces()).map((row) => row.notes)).toEqual((await readTab('pieces')).rows.map((row) => row.values.notes));

		await backToSheet();
		expect((await store.dataState()).source).toBe('sheet');
		expect((await readTab('pieces')).rows[0].values.notes).toBe('Aus D1');
	});
});
