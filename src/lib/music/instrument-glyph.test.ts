import { describe, expect, it } from 'vitest';
import { instrumentGlyph } from './instrument-glyph.ts';

describe('instrumentGlyph', () => {
	it('goes by the name first', () => {
		expect(instrumentGlyph('Geige', 'streicher')).toBe('violin');
		expect(instrumentGlyph('Kontrabass', 'streicher')).toBe('cello');
		expect(instrumentGlyph('Bassklarinette', 'holz')).toBe('clarinet');
		expect(instrumentGlyph('Alt-Saxophon', 'holz')).toBe('sax');
		expect(instrumentGlyph('Tenor-Blockflöte', 'holz')).toBe('flute');
		expect(instrumentGlyph('Bassposaune', 'blech')).toBe('trombone');
		expect(instrumentGlyph('Große Trommel', 'schlagwerk')).toBe('drum');
		expect(instrumentGlyph('Xylophon', 'schlagwerk')).toBe('mallets');
	});

	it('keeps the Englischhorn among the woodwinds', () => {
		expect(instrumentGlyph('Englischhorn', 'holz')).toBe('clarinet');
		expect(instrumentGlyph('Horn', 'blech')).toBe('horn');
	});

	it('falls back to the family, then to a part', () => {
		expect(instrumentGlyph('Alphorn', 'blech')).toBe('horn');
		expect(instrumentGlyph('Mandoline', 'streicher')).toBe('violin');
		expect(instrumentGlyph('Akkordeon', 'tasten')).toBe('keys');
		expect(instrumentGlyph('B-Stimmen', 'sonstige')).toBe('score');
		expect(instrumentGlyph('Tröte', undefined)).toBe('score');
	});
});
