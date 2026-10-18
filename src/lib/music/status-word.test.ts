import { describe, expect, it } from 'vitest';
import { config } from '#lib/config/index.ts';
import { withoutStatusWord, withStatusWord } from './status-word.ts';

const naming = config.naming;

describe('withStatusWord', () => {
	it.each([
		['Elegie - Viola.pdf', 'incomplete', 'Elegie - Viola - UNVOLLSTÄNDIG.pdf'],
		['BWV 147 - Geige II.pdf', 'empty', 'BWV 147 - Geige II - LEER.pdf'],
		// An existing status word is replaced, not doubled.
		['BWV 147 - Geige II - LEER.pdf', 'incomplete', 'BWV 147 - Geige II - UNVOLLSTÄNDIG.pdf'],
		['Sword Dance - Partitur - fehlt.pdf', 'missing', 'Sword Dance - Partitur - FEHLT.pdf'],
		// Google Docs placeholders have no extension.
		['Sword Dance - Partitur', 'missing', 'Sword Dance - Partitur - FEHLT']
	] as const)('%j + %s → %j', (name, status, expected) => {
		expect(withStatusWord(name, status, naming)).toBe(expected);
	});
});

describe('withoutStatusWord', () => {
	it('takes out the word the app put in', () => {
		expect(withoutStatusWord('Elegie - Viola - UNVOLLSTÄNDIG.pdf', 'incomplete', naming)).toBe('Elegie - Viola.pdf');
	});

	it('leaves the name alone when someone changed the status by hand meanwhile', () => {
		expect(withoutStatusWord('Elegie - Viola - LEER.pdf', 'incomplete', naming)).toBe('Elegie - Viola - LEER.pdf');
		expect(withoutStatusWord('Elegie - Viola.pdf', 'incomplete', naming)).toBe('Elegie - Viola.pdf');
	});

	it('only looks at the end of the name', () => {
		expect(withoutStatusWord('LEER - Viola.pdf', 'empty', naming)).toBe('LEER - Viola.pdf');
	});

	it('round-trips', () => {
		const name = 'Carmen Suite - Horn in F 2.pdf';
		expect(withoutStatusWord(withStatusWord(name, 'empty', naming), 'empty', naming)).toBe(name);
	});
});
