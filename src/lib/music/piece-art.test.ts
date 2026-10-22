import { describe, expect, it } from 'vitest';
import { pieceArt } from './piece-art.ts';

describe('pieceArt', () => {
	it('draws the genre, also in a list or longer word', () => {
		expect(pieceArt({ genre: 'Filmmusik', title: 'Themes from 007' })).toBe('filmmusik');
		expect(pieceArt({ genre: 'Konzertmarsch', title: 'Florentiner' })).toBe('marsch-blasmusik');
		expect(pieceArt({ genre: 'Klassik, Weihnachtslied', title: 'Stille Nacht' })).toBe('weihnachten');
		expect(pieceArt({ genre: 'Operette', title: 'Die Fledermaus' })).toBe('oper');
		expect(pieceArt({ genre: 'Big Band', title: 'In the Mood' })).toBe('jazz');
	});

	it('without a known genre: a staff for titles A–G, a violin for the rest', () => {
		expect(pieceArt({ genre: 'Ouvertüre', title: 'Egmont Ouvertüre' })).toBe('staff');
		expect(pieceArt({ title: 'Morgenstimmung' })).toBe('violin');
		expect(pieceArt({ title: 'Die Moldau' })).toBe('violin');
		expect(pieceArt({ title: 'Der Bürger als Edelmann' })).toBe('staff');
		expect(pieceArt({ title: 'Ägyptischer Marsch' })).toBe('staff');
		expect(pieceArt({ title: '1812' })).toBe('violin');
	});
});
