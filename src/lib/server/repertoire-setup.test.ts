import { describe, expect, it } from 'vitest';
import { RIGHTS } from '#lib/access/access.ts';
import type { GoogleClient } from './google/client.ts';
import { columnLetter } from './google/sheets.ts';
import { setUpSheet } from './repertoire-setup.ts';

interface FakeTab {
	sheetId: number;
	title: string;
	values: string[][];
	protections: string[];
}

/** A tiny in-memory stand-in for the Sheets API calls setup makes. */
function fakeSheets(tabs: FakeTab[]) {
	const requests: Record<string, unknown>[] = [];
	const valueWrites: { range: string; values: string[][] }[] = [];
	const tabOf = (range: string) => tabs.find((tab) => range.startsWith(`'${tab.title}'`));

	const client = {
		async request(url: string, { method = 'GET', body }: { method?: string; body?: any } = {}) {
			const target = new URL(url);
			if (method === 'GET' && target.pathname.endsWith('values:batchGet')) {
				const ranges = target.searchParams.getAll('ranges');
				return {
					valueRanges: ranges.map((range) => {
						const values = tabOf(range)?.values ?? [];
						return { values: range.endsWith('!1:1') ? values.slice(0, 1) : values };
					})
				};
			}
			if (method === 'GET') {
				return {
					sheets: tabs.map((tab) => ({
						properties: { sheetId: tab.sheetId, title: tab.title },
						protectedRanges: tab.protections.map((description) => ({ description }))
					}))
				};
			}
			if (target.pathname.endsWith('values:batchUpdate')) {
				for (const write of body.data) {
					valueWrites.push(write);
					const tab = tabOf(write.range)!;
					const start = write.range.match(/!([A-Z]+)1$/)![1];
					const offset = [...Array(26).keys()].find((i) => columnLetter(i) === start)!;
					tab.values[0] = [...(tab.values[0] ?? [])];
					write.values[0].forEach((value: string, i: number) => (tab.values[0][offset + i] = value));
				}
				return {};
			}
			for (const request of body.requests) {
				requests.push(request);
				if (request.addSheet) {
					tabs.push({ sheetId: 100 + tabs.length, title: request.addSheet.properties.title, values: [], protections: [] });
				}
				if (request.deleteSheet) tabs.splice(tabs.findIndex((tab) => tab.sheetId === request.deleteSheet.sheetId), 1);
				if (request.addProtectedRange) {
					const range = request.addProtectedRange.protectedRange;
					tabs.find((tab) => tab.sheetId === range.range.sheetId)!.protections.push(range.description);
				}
			}
			return { replies: [] };
		}
	} as unknown as GoogleClient;
	return { client, tabs, requests, valueWrites };
}

const kinds = (requests: Record<string, unknown>[]) => requests.map((request) => Object.keys(request)[0]);

describe('setUpSheet', () => {
	it('turns a new, empty spreadsheet into all tabs', async () => {
		const fake = fakeSheets([{ sheetId: 0, title: 'Tabellenblatt1', values: [], protections: [] }]);
		const result = await setUpSheet(fake.client, 'sheet', { orchestras: ['EO', 'A'] });

		const all = ['Stücke', 'Konzerte', 'Programm', 'Mitglieder', 'Gruppen', 'Rechte', 'Zugangsanfragen'];
		expect(result).toEqual({ createdTabs: all, addedColumns: [], removedTab: 'Tabellenblatt1' });
		expect(fake.tabs.map((tab) => tab.title)).toEqual(all);
		expect(fake.tabs[1].values[0]).toEqual(['Datum', 'Anlass', 'Ort', 'Orchester', 'Kalender-Event-ID']);
		expect(fake.tabs[2].values[0]).toEqual(['Konzert', 'Nr.', 'Stück', 'Notiz']);

		const dropdowns = fake.requests.filter((r) => 'setDataValidation' in r) as any[];
		expect(dropdowns.map((r) => r.setDataValidation.rule.condition.values)).toEqual([
			[{ userEnteredValue: "='Konzerte'!$B$2:$B" }],
			[{ userEnteredValue: "='Stücke'!$A$2:$A" }],
			RIGHTS.map((right) => ({ userEnteredValue: right })),
			[{ userEnteredValue: 'EO' }, { userEnteredValue: 'A' }]
		]);
		expect(kinds(fake.requests).filter((k) => k === 'addProtectedRange')).toHaveLength(2);
	});

	it('only adds what is missing when run again, and keeps other tabs', async () => {
		const fake = fakeSheets([
			{ sheetId: 0, title: 'Notizen', values: [['etwas']], protections: [] },
			{ sheetId: 1, title: 'Stücke', values: [['Drive-Ordner-ID', 'Titel'], ['abc', 'Bolero']], protections: [] }
		]);
		await setUpSheet(fake.client, 'sheet', { orchestras: ['EO'] });
		const first = fake.requests.length;
		const result = await setUpSheet(fake.client, 'sheet', { orchestras: ['EO'] });

		expect(result.createdTabs).toEqual([]);
		expect(result.addedColumns).toEqual([]);
		expect(fake.tabs.map((tab) => tab.title).slice(0, 4)).toEqual(['Notizen', 'Stücke', 'Konzerte', 'Programm']);
		// Existing columns stay where they are; missing ones follow.
		expect(fake.tabs[1].values[0].slice(0, 3)).toEqual(['Drive-Ordner-ID', 'Titel', 'Komponist']);
		expect(fake.tabs[1].values[1]).toEqual(['abc', 'Bolero']);
		// The dropdown follows the title column wherever it is.
		const pieceDropdown = (fake.requests as any[]).find(
			(r) => r.setDataValidation?.rule.condition.values[0].userEnteredValue?.includes('Stücke')
		);
		expect(pieceDropdown.setDataValidation.rule.condition.values[0].userEnteredValue).toBe("='Stücke'!$B$2:$B");
		// No second protection, no deleted tab.
		const second = fake.requests.slice(first);
		expect(kinds(second)).not.toContain('addProtectedRange');
		expect(kinds(fake.requests)).not.toContain('deleteSheet');
	});
});
