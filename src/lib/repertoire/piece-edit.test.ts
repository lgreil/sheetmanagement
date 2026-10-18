import { describe, expect, it } from 'vitest';
import { checkPieceValues, findPieceRow, pieceValues, pieceVersion, renameInProgram, type PieceValues } from './piece-edit.ts';
import { LAYOUT, readTable } from './sheet.ts';

const pieces = readTable(
	[
		['Titel', 'Komponist', 'Werkverzeichnis', 'Arrangeur', 'Genre', 'Schwierigkeit', 'Notiz', 'Geprüft am', 'Drive-Ordner-ID', 'Hörbeispiel'],
		['Bolero', 'Ravel', '', '', '', '', '', '', 'folder-1', ''],
		['Ave Maria', 'Schubert', '', '', '', '', '', '', '', ''],
		['Carmen', 'Bizet', '', '', '', '', '', '', 'folder-2', '']
	],
	LAYOUT.pieces.columns
);
const program = readTable(
	[
		['Konzert', 'Nr.', 'Stück', 'Notiz'],
		['Herbst 1990', '1', 'Ave Maria', ''],
		['Herbst 1990', '2', 'Bolero', ''],
		['Weihnacht 1991', '1', 'ave maria', '']
	],
	LAYOUT.program.columns
);
const edit = (change: Partial<PieceValues>): PieceValues => ({ ...pieceValues(pieces.rows[0]), ...change });

describe('findPieceRow', () => {
	it('finds a Drive piece by folder and a sheet-only piece by title', () => {
		expect(findPieceRow(pieces, { driveFolderId: 'folder-2', title: 'egal' })?.row).toBe(4);
		expect(findPieceRow(pieces, { title: 'AVE MARIA' })?.row).toBe(3);
		expect(findPieceRow(pieces, { driveFolderId: 'gone', title: 'Bolero' })).toBeUndefined();
	});
});

describe('pieceVersion', () => {
	it('changes when an editable cell changes', () => {
		const changed = { ...pieces.rows[0], values: { ...pieces.rows[0].values, notes: 'neu' } };
		expect(pieceVersion(changed)).not.toBe(pieceVersion(pieces.rows[0]));
		expect(pieceVersion({ ...pieces.rows[0] })).toBe(pieceVersion(pieces.rows[0]));
	});
});

describe('checkPieceValues', () => {
	it('trims and accepts a valid edit', () => {
		expect(checkPieceValues(edit({ composer: '  Maurice Ravel ' }), pieces, 2)).toMatchObject({ values: { composer: 'Maurice Ravel' } });
	});

	it.each([
		[{ title: ' ' }, 'title-missing'],
		[{ title: 'carmen' }, 'title-taken'],
		[{ recording: 'javascript:alert(1)' }, 'bad-link']
	] as const)('%j → %s', (change, problem) => {
		expect(checkPieceValues(edit(change), pieces, 2)).toEqual({ problem });
	});

	it('lets a piece keep its own title', () => {
		expect('values' in checkPieceValues(edit({ title: 'BOLERO' }), pieces, 2)).toBe(true);
	});
});

describe('renameInProgram', () => {
	it('renames the piece in every programme, however it was typed', () => {
		expect(renameInProgram(program, 'Ave Maria', 'Ave Maria (Schubert)')).toEqual([
			{ row: 2, values: { piece: 'Ave Maria (Schubert)' } },
			{ row: 4, values: { piece: 'Ave Maria (Schubert)' } }
		]);
	});

	it('does nothing when the title stays the same', () => {
		expect(renameInProgram(program, 'Bolero', 'Bolero')).toEqual([]);
	});
});
