import { describe, expect, it } from 'vitest';
import { matchRows } from './row-match.ts';
import { readTable } from './sheet.ts';

const columns = { event: 'Termin', who: 'Wer', answer: 'Antwort' };
const header = ['Termin', 'Wer', 'Antwort'];
const table = (...rows: string[][]) => readTable([header, ...rows], columns);

describe('matchRows', () => {
	const before = table(['Probe 1', 'a@x.de', 'ja'], ['Probe 1', 'b@x.de', 'nein'], ['Probe 2', 'a@x.de', 'ja']);

	it('keeps the numbers when nothing changed', () => {
		expect(matchRows(before, before, [3, 4])).toEqual(new Map([[3, 3], [4, 4]]));
	});

	it('follows a row when one above it was deleted by hand', () => {
		const now = table(['Probe 1', 'b@x.de', 'nein'], ['Probe 2', 'a@x.de', 'ja']);
		expect(matchRows(before, now, [3, 4])).toEqual(new Map([[3, 2], [4, 3]]));
	});

	it('follows a row when one was inserted above it', () => {
		const now = table(['Neu', 'c@x.de', 'ja'], ['Probe 1', 'a@x.de', 'ja'], ['Probe 1', 'b@x.de', 'nein'], ['Probe 2', 'a@x.de', 'ja']);
		expect(matchRows(before, now, [2])).toEqual(new Map([[2, 3]]));
	});

	it('refuses when the row was changed or deleted in the meantime', () => {
		expect(matchRows(before, table(['Probe 1', 'a@x.de', 'ja'], ['Probe 1', 'b@x.de', 'ja']), [3])).toBeUndefined();
		expect(matchRows(before, table(['Probe 1', 'a@x.de', 'ja']), [3])).toBeUndefined();
	});

	it('refuses a row number that was not in the read', () => {
		expect(matchRows(before, before, [9])).toBeUndefined();
	});

	it('gives identical rows one match each', () => {
		const twice = table(['Probe 1', 'a@x.de', 'ja'], ['Probe 1', 'a@x.de', 'ja']);
		expect(matchRows(twice, twice, [2, 3])).toEqual(new Map([[2, 2], [3, 3]]));
		expect(matchRows(twice, table(['Probe 1', 'a@x.de', 'ja']), [2, 3])).toBeUndefined();
	});
});
