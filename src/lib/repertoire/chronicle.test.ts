import { describe, expect, it } from 'vitest';
import { chronicleStats, firstPerformances, playedPieces, timeline, type ChronicleConcert, type ChroniclePiece } from './chronicle.ts';

const concert = (id: string, dateKey: string, program: [string, string?, string?][]): ChronicleConcert => ({
	id,
	title: id,
	dateKey,
	program: program.map(([title, pieceId, composer]) => ({ title, pieceId, composer }))
});

const concerts = [
	concert('w62', '1962-12', [['Stille Nacht', 'stille', 'Gruber'], ['Ungarischer Tanz Nr. 5', undefined, 'Brahms']]),
	concert('f98', '1998-04', [['Eine kleine Nachtmusik', 'nacht', 'Mozart'], ['Morgenstimmung', 'grieg', 'Grieg']]),
	concert('s26', '2026-08-23', [['Eine kleine Nachtmusik', 'nacht', 'Mozart'], ['Themes from 007', '007', 'Barry']]),
	concert('h26', '2026-11-16', [['Egmont', 'egmont', 'Beethoven'], ['Eine kleine Nachtmusik', 'nacht', 'Mozart'], ['Morgenstimmung', 'grieg', 'Grieg']]),
	concert('old', '', [['Stille Nacht', 'stille', 'Gruber']])
];

const archive: ChroniclePiece[] = [
	{ id: 'nacht', title: 'Eine kleine Nachtmusik', composer: 'Mozart', hasMusic: true },
	{ id: 'sleigh', title: 'Sleigh Ride', composer: 'Anderson', hasMusic: true },
	{ id: 'jesu', title: 'Jesu bleibet meine Freude', composer: 'Bach', hasMusic: true },
	{ id: 's-only', title: 'Nur im Sheet', hasMusic: false }
];

describe('firstPerformances', () => {
	it('finds the earliest dated concert per piece', () => {
		const first = firstPerformances(concerts);
		expect(first.get('nacht')).toBe('f98');
		expect(first.get('stille')).toBe('w62');
		expect(first.get('egmont')).toBe('h26');
		expect(first.get('title:ungarischer tanz nr. 5')).toBe('w62');
	});

	it('leaves out pieces played only at concerts without a date', () => {
		expect(firstPerformances([concert('x', '', [['Bolero']])]).size).toBe(0);
	});
});

describe('playedPieces', () => {
	it('counts concerts, not programme rows', () => {
		const played = playedPieces([concert('a', '2000', [['Bolero'], ['bolero']])]);
		expect(played.get('title:bolero')?.count).toBe(1);
	});
});

describe('chronicleStats', () => {
	const stats = chronicleStats(concerts, archive, 2026);

	it('sums up the history', () => {
		expect(stats.concerts).toBe(5);
		expect(stats.firstYear).toBe(1962);
		expect(stats.lastYear).toBe(2026);
		expect(stats.pieces).toBe(6);
		expect(stats.performances).toBe(10);
	});

	it('lists the most played pieces, only those played more than once', () => {
		expect(stats.mostPlayed.map((piece) => [piece.title, piece.count])).toEqual([
			['Eine kleine Nachtmusik', 3],
			['Morgenstimmung', 2],
			['Stille Nacht', 2]
		]);
	});

	it('finds pieces not played for ten years, longest ago first', () => {
		expect(stats.longAgo.map((piece) => [piece.title, piece.lastYear])).toEqual([
			['Stille Nacht', 1962],
			['Ungarischer Tanz Nr. 5', 1962]
		]);
	});

	it('says which of them are on a coming programme', () => {
		const result = chronicleStats(concerts, archive, 2026, new Set(['stille']));
		expect(result.longAgo.map((piece) => [piece.title, piece.planned])).toEqual([
			['Stille Nacht', true],
			['Ungarischer Tanz Nr. 5', false]
		]);
	});

	it('names archive pieces never played', () => {
		expect(stats.neverPlayed.count).toBe(2);
		expect(stats.neverPlayed.pieces.map((piece) => piece.title)).toEqual(['Jesu bleibet meine Freude', 'Sleigh Ride']);
	});

	it('groups by decade with the composers played most', () => {
		expect(stats.decades).toEqual([
			{ decade: 1960, concerts: 1, pieces: 2, composers: ['Brahms', 'Gruber'] },
			{ decade: 1990, concerts: 1, pieces: 2, composers: ['Grieg', 'Mozart'] },
			{ decade: 2020, concerts: 2, pieces: 4, composers: ['Mozart', 'Barry', 'Beethoven'] }
		]);
	});

	it('counts several composers of one piece for each', () => {
		const result = chronicleStats([concert('a', '2001', [['Duett', 'd', 'Mozart, Haydn']])], [], 2026);
		expect(result.composers.map((c) => c.name)).toEqual(['Haydn', 'Mozart']);
	});

	it('is empty without concerts', () => {
		const result = chronicleStats([], archive, 2026);
		expect(result.concerts).toBe(0);
		expect(result.firstYear).toBeUndefined();
		expect(result.decades).toEqual([]);
		expect(result.neverPlayed.count).toBe(3);
	});
});

describe('timeline', () => {
	const decades = timeline(concerts);

	it('goes newest first, undated concerts at the end', () => {
		expect(decades.map((d) => d.decade)).toEqual([2020, 1990, 1960, null]);
		expect(decades[0].years[0].concerts.map((c) => c.id)).toEqual(['h26', 's26']);
	});

	it('marks the pieces played for the first time', () => {
		const h26 = decades[0].years[0].concerts[0];
		expect(h26.debuts).toEqual([0]);
		const s26 = decades[0].years[0].concerts[1];
		expect(s26.debuts).toEqual([1]);
	});
});
