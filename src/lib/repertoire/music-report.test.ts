import { describe, expect, it } from 'vitest';
import { reportGaps, reportRows, toCsv } from './music-report.ts';

const pieces = [
	{ pieceId: 'a', title: 'Egmont Ouvertüre', composer: 'Ludwig van Beethoven', publisher: 'Breitkopf', duration: 510 },
	{ pieceId: 'b', title: 'Themes from 007', composer: 'John Barry', arranger: 'Mia Musterfrau' },
	{ title: 'Zugabe; "Überraschung"' }
];

describe('reportGaps', () => {
	it('lists what each piece still lacks, in programme order', () => {
		expect(reportGaps(pieces)).toEqual([
			{ pieceId: 'b', title: 'Themes from 007', missing: ['publisher', 'duration'] },
			{ pieceId: undefined, title: 'Zugabe; "Überraschung"', missing: ['composer', 'publisher', 'duration'] }
		]);
	});
});

describe('reportRows', () => {
	it('numbers the pieces and writes durations as m:ss', () => {
		const rows = reportRows(pieces);
		expect(rows[0]).toEqual(['Nr.', 'Titel', 'Komponist', 'Bearbeiter', 'Verlag', 'Dauer']);
		expect(rows[1]).toEqual(['1', 'Egmont Ouvertüre', 'Ludwig van Beethoven', '', 'Breitkopf', '8:30']);
		expect(rows[2][3]).toBe('Mia Musterfrau');
	});
});

describe('toCsv', () => {
	it('uses semicolons, quotes where needed and starts with a BOM', () => {
		const csv = toCsv([
			['Nr.', 'Titel'],
			['1', 'Zugabe; "Überraschung"']
		]);
		expect(csv).toBe('﻿Nr.;Titel\r\n1;"Zugabe; ""Überraschung"""\r\n');
	});

	it('keeps formulas from running', () => {
		expect(toCsv([['=HYPERLINK("x")', '-1']])).toBe('﻿"\'=HYPERLINK(""x"")";\'-1\r\n');
	});
});
