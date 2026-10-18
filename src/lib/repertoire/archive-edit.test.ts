import { describe, expect, it } from 'vitest';
import { checkNewConcert, checkNewPiece } from './archive-edit.ts';
import { LAYOUT, readTable } from './sheet.ts';

const concerts = readTable(
	[
		['Datum', 'Anlass', 'Ort', 'Orchester', 'Kalender-Event-ID'],
		['1957-12', 'Weihnachtskonzert 1957', 'Kirche', 'EO', '']
	],
	LAYOUT.concerts.columns
);
const pieces = readTable([['Titel', 'Komponist'], ['Sleigh Ride', 'Anderson']], LAYOUT.pieces.columns);
const concert = { date: '1962', title: 'Sommerkonzert 1962', location: '', orchestra: 'EO' };

describe('checkNewConcert', () => {
	it.each(['1962', '1962-06', '21.06.1962', '06.1962', ''])('accepts the date %j', (date) => {
		expect(checkNewConcert({ ...concert, date }, concerts)).toEqual({ values: { ...concert, date } });
	});

	it.each([
		[{ title: '  ' }, 'title-missing'],
		[{ date: 'im Sommer' }, 'bad-date'],
		[{ title: 'weihnachtskonzert 1957 ' }, 'title-taken']
	] as const)('%j → %s', (change, problem) => {
		expect(checkNewConcert({ ...concert, ...change }, concerts)).toEqual({ problem });
	});

	it('trims what was typed', () => {
		expect(checkNewConcert({ ...concert, location: ' Aula ' }, concerts)).toMatchObject({ values: { location: 'Aula' } });
	});
});

describe('checkNewPiece', () => {
	it('accepts a new title and refuses one that exists', () => {
		expect(checkNewPiece({ title: 'Ave Maria', composer: 'Schubert', catalogue: 'D 839' }, pieces)).toMatchObject({ values: { title: 'Ave Maria' } });
		expect(checkNewPiece({ title: 'SLEIGH RIDE', composer: '', catalogue: '' }, pieces)).toEqual({ problem: 'title-taken' });
		expect(checkNewPiece({ title: '', composer: 'X', catalogue: '' }, pieces)).toEqual({ problem: 'title-missing' });
	});
});
