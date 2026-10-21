import { describe, expect, it } from 'vitest';
import { config } from '#lib/config/index.ts';
import { readScoreText, tidyCatalogue } from './score-text.ts';

const read = (lines: string[]) => readScoreText(lines, config.naming);

describe('readScoreText', () => {
	it('reads composers and arrangers as printed on title pages', () => {
		expect(read(['Mamma Mia', 'Words and Music by Benny Andersson, Bjorn Ulvaeus and Stig Anderson', 'Arranged by Peter Martin'])).toEqual({
			composer: 'Benny Andersson, Bjorn Ulvaeus and Stig Anderson',
			arranger: 'Peter Martin'
		});
		expect(read(['SUPERMAN RETURNS', 'Music by', 'JOHN OTTMAN', 'Arranged by', 'Michael Brown'])).toEqual({
			composer: 'John Ottman',
			arranger: 'Michael Brown'
		});
		expect(read(['Avengers', 'Musik: Alan Silvestri', 'Bearbeitung: Anna Beispiel'])).toEqual({
			composer: 'Alan Silvestri',
			arranger: 'Anna Beispiel'
		});
	});

	it('finds a known composer on a line of its own, and the catalogue number', () => {
		expect(read(['ÉLÉGIE', 'op.24', 'Gabriel FAURÉ', 'Violoncelle Solo'])).toEqual({ composer: 'Gabriel Fauré', catalogue: 'Op. 24' });
		expect(read(['Toccata', 'BWV565', 'J. S. Bach'])).toEqual({ composer: 'J. S. Bach', catalogue: 'BWV 565' });
	});

	it('drops purchase and licence lines, which name people', () => {
		const result = read(['Mamma Mia', 'SheetMusicDirect.com Order 9402227', '1 copy purchased by Erika Mustermann on Jan 08, 2024']);
		expect(JSON.stringify(result)).not.toContain('Mustermann');
		expect(result).toEqual({});
	});

	it('guesses nothing from noise', () => {
		expect(read(['° ¢ { ° ¢', 'Flute', 'Oboe', 'Clarinet in B'])).toEqual({});
		expect(read([])).toEqual({});
		expect(read(['Music for Orchestra'])).toEqual({});
		expect(read(['Music from Evita', 'Musik Arena'])).toEqual({});
	});
});

describe('tidyCatalogue', () => {
	it.each([
		['op.24', 'Op. 24'],
		['bwv1068', 'BWV 1068'],
		['KV 525', 'KV 525'],
		['K. 527', 'KV 527'],
		['D 759', 'D. 759'],
		['Hob. I:94', 'Hob. I:94']
	])('%s → %s', (text, expected) => {
		expect(tidyCatalogue(text)).toBe(expected);
	});
});
