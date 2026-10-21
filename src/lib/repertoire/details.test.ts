import { describe, expect, it } from 'vitest';
import { gapCounts, gapsOf, nextWithGaps, parseGapFilter, type DetailPiece } from './details.ts';

const pieces: DetailPiece[] = [
	{ id: 'a', composer: 'Bach', catalogue: 'BWV 565', sheet: { genre: 'Barock', recording: 'https://example.org' } },
	{ id: 'b', composer: 'Rossini', sheet: { genre: '' } },
	{ id: 'c', sheet: { genre: 'Pop', recording: 'https://example.org' } },
	{ id: 'd', composer: 'Fauré', catalogue: 'Op. 24', sheet: { recording: 'https://example.org' } },
	{ id: 'e', composer: 'Folder only' }
];

describe('gapsOf', () => {
	it('lists what a filter looks for and the piece lacks', () => {
		expect(gapsOf(pieces[1], 'alle')).toEqual(['genre', 'recording']);
		expect(gapsOf(pieces[2], 'alle')).toEqual(['composer']);
		expect(gapsOf(pieces[0], 'alle')).toEqual([]);
	});

	it('counts a missing Werkverzeichnis only with a known composer', () => {
		expect(gapsOf(pieces[1], 'werkverzeichnis')).toEqual(['catalogue']);
		expect(gapsOf(pieces[2], 'werkverzeichnis')).toEqual([]);
	});

	it('leaves out pieces without a row in the sheet', () => {
		expect(gapsOf(pieces[4], 'alle')).toEqual([]);
	});
});

it('counts per filter', () => {
	expect(gapCounts(pieces)).toEqual({ alle: 3, komponist: 1, genre: 2, hoerbeispiel: 1, werkverzeichnis: 1 });
});

describe('nextWithGaps', () => {
	it('goes to the next piece with gaps, starting over at the top', () => {
		expect(nextWithGaps(pieces, 'alle', 'b')).toBe('c');
		expect(nextWithGaps(pieces, 'alle', 'd')).toBe('b');
		expect(nextWithGaps(pieces, 'komponist', 'c')).toBeNull();
	});
});

it('reads the filter from the URL', () => {
	expect(parseGapFilter('genre')).toBe('genre');
	expect(parseGapFilter('x')).toBeNull();
	expect(parseGapFilter(null)).toBeNull();
});
