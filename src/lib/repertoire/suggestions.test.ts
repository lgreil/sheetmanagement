import { describe, expect, it } from 'vitest';
import { programSuggestions, type SuggestPiece, type SuggestWish } from './suggestions.ts';

const pieces: SuggestPiece[] = [
	{ id: 'fame', title: 'Fame', genre: 'Film', lastPlayed: '2024-11', pickable: true },
	{ id: 'bolero', title: 'Bolero', genre: 'Klassik', lastPlayed: '2009-12', pickable: true },
	{ id: 'carmen', title: 'Carmen', genre: 'Oper', lastPlayed: '1998', pickable: true },
	{ id: 'sleigh', title: 'Sleigh Ride', genre: 'Weihnachten', lastPlayed: '2001-12', pickable: true },
	{ id: 'avengers', title: 'Avengers', genre: 'Film', lastPlayed: '2005', pickable: false }
];

const wish = (overrides: Partial<SuggestWish>): SuggestWish => ({
	id: 'w',
	title: '',
	concert: '',
	votes: 0,
	status: 'open',
	...overrides
});

describe('programSuggestions', () => {
	const result = programSuggestions({
		concertTitle: 'Herbstkonzert 2026',
		programPieceIds: ['fame'],
		pieces,
		today: '2026-10-20',
		wishes: [
			wish({ id: 'w1', title: 'Bolero', pieceId: 'bolero', votes: 2 }),
			wish({ id: 'w2', title: 'Bolero', pieceId: 'bolero', concert: 'herbstkonzert 2026', votes: 1 }),
			wish({ id: 'w3', title: 'Neues Stück', votes: 5 }),
			wish({ id: 'w4', title: 'Carmen', pieceId: 'carmen', concert: 'Weihnachtskonzert 2026', votes: 9 }),
			wish({ id: 'w5', title: 'Fame', pieceId: 'fame', votes: 3 }),
			wish({ id: 'w6', title: 'Sleigh Ride', pieceId: 'sleigh', votes: 7, status: 'done' })
		]
	});

	it('lists wishes for this concert or any time, merged per piece and sorted by +1s', () => {
		expect(result.wished.map((s) => [s.title, s.votes, s.wishIds, s.forThisConcert, s.pieceId])).toEqual([
			['Neues Stück', 5, ['w3'], false, undefined],
			['Bolero', 3, ['w1', 'w2'], true, 'bolero']
		]);
	});

	it('knows the programme genres and marks suggestions adding a new one', () => {
		expect(result.genres).toEqual(['Film']);
		expect(result.wished.find((s) => s.title === 'Bolero')?.newGenre).toBe(true);
	});

	it('compares genre lists name by name', () => {
		const mixed = programSuggestions({
			concertTitle: 'Sommer',
			programPieceIds: ['fame', 'mix'],
			pieces: [...pieces, { id: 'mix', title: 'Mix', genre: 'Pop, Film', pickable: true }, { id: 'both', title: 'Both', genre: 'film, pop', lastPlayed: '1990', pickable: true }],
			today: '2026-10-20',
			wishes: [wish({ id: 'w9', title: 'Both', pieceId: 'both', votes: 1 }), wish({ id: 'w10', title: 'Bolero', pieceId: 'bolero', votes: 1 })]
		});
		expect(mixed.genres).toEqual(['Film', 'Pop']);
		expect(mixed.wished.find((s) => s.title === 'Both')?.newGenre).toBe(false);
		expect(mixed.wished.find((s) => s.title === 'Bolero')?.newGenre).toBe(true);
	});

	it('suggests pickable pieces not played for a long time, new genres first', () => {
		expect(result.longAgo.map((s) => s.title)).toEqual(['Carmen', 'Sleigh Ride']);
	});
});
