import { describe, expect, it } from 'vitest';
import { composerAsUsual, durationOf, searchQueries, searchWorks, suggestGenre, workDetails, yearOf } from './wikidata.ts';

/** A fake Wikidata: answers by the request's parameters. */
function fakeFetch(answer: (params: URLSearchParams) => unknown) {
	const calls: URLSearchParams[] = [];
	const fetchImpl = (async (url: string) => {
		const params = new URL(url).searchParams;
		calls.push(params);
		return new Response(JSON.stringify(answer(params)));
	}) as typeof fetch;
	return { fetchImpl, calls };
}

const time = (time: string, precision: number) => [{ mainsnak: { datavalue: { value: { time, precision } } } }];
const item = (id: string) => ({ mainsnak: { datavalue: { value: { id } } } });

const ENTITIES: Record<string, unknown> = {
	Q392734: {
		labels: { de: { value: 'Toccata und Fuge d-Moll BWV 565' } },
		claims: {
			P86: [item('Q1339')],
			P31: [item('Q207628'), item('Q1475')],
			P528: [{ mainsnak: { datavalue: { value: '565' } }, qualifiers: { P972: [{ datavalue: { value: { id: 'Q214203' } } }] } }],
			P571: time('+1700-00-00T00:00:00Z', 8)
		}
	},
	Q1339: { labels: { de: { value: 'Johann Sebastian Bach' } } },
	Q1475: { labels: { de: { value: 'Toccata' } } },
	Q214203: { labels: { de: { value: 'Bach-Werke-Verzeichnis' } }, claims: { P1813: [{ mainsnak: { datavalue: { value: { text: 'BWV', language: 'de' } } } }] } },
	Q2: { labels: { de: { value: 'Sinfonie Nr. 9 op. 125' } }, claims: { P86: [item('Q255')], P577: time('+1824-05-07T00:00:00Z', 11) } },
	Q255: { labels: { en: { value: 'Ludwig van Beethoven' } } }
};

const entities = (params: URLSearchParams) => ({
	entities: Object.fromEntries((params.get('ids') ?? '').split('|').map((id) => [id, ENTITIES[id] ?? {}]))
});

describe('searchWorks', () => {
	it('searches works with a composer, and falls back to the title alone', async () => {
		const { fetchImpl, calls } = fakeFetch((params) =>
			params.get('list') === 'search'
				? { query: { search: params.get('srsearch')!.includes('Bach') ? [] : [{ title: 'Q392734' }] } }
				: { entities: { Q392734: { labels: { de: { value: 'Toccata und Fuge' } }, descriptions: { en: { value: 'organ piece' } } } } }
		);
		expect(await searchWorks('Toccata', 'Bach', fetchImpl)).toEqual([{ id: 'Q392734', label: 'Toccata und Fuge', description: 'organ piece' }]);
		expect(calls.map((c) => c.get('srsearch'))).toEqual(['Toccata Bach haswbstatement:P86', 'Toccata haswbstatement:P86', null]);
		expect(calls.every((c) => c.get('origin') === '*')).toBe(true);
	});

	it('tries the distinctive words when the whole title finds nothing', () => {
		expect(searchQueries('Wilhelm Tell Overture', 'Rossini')).toEqual(['Wilhelm Tell Overture Rossini', 'Wilhelm Tell Rossini', 'Wilhelm Tell Overture']);
		expect(searchQueries('Mamma Mia', 'Benny Andersson, Bjorn Ulvaeus and Stig Anderson')).toEqual(['Mamma Mia Andersson', 'Mamma Mia']);
		expect(searchQueries('Highlights from Wicked')).toEqual(['Wicked', 'Highlights from Wicked']);
		expect(searchQueries('Air')).toEqual(['Air']);
	});
});

describe('workDetails', () => {
	it('reads composer, catalogue with its short name, year and kind', async () => {
		const { fetchImpl } = fakeFetch(entities);
		expect(await workDetails('Q392734', fetchImpl)).toEqual({
			id: 'Q392734',
			url: 'https://www.wikidata.org/wiki/Q392734',
			label: 'Toccata und Fuge d-Moll BWV 565',
			composers: ['Johann Sebastian Bach'],
			catalogue: 'BWV 565',
			year: undefined,
			kinds: ['Toccata'],
			youtube: undefined
		});
	});

	it('takes an opus number from the name when there is no catalogue claim', async () => {
		const { fetchImpl } = fakeFetch(entities);
		const details = await workDetails('Q2', fetchImpl);
		expect([details.composers, details.catalogue, details.year]).toEqual([['Ludwig van Beethoven'], 'Op. 125', 1824]);
	});
});

describe('yearOf', () => {
	it('needs at least a year', () => {
		expect(yearOf({ P571: time('+1883-01-01T00:00:00Z', 9) })).toBe(1883);
		expect(yearOf({ P571: time('+1700-00-00T00:00:00Z', 8) })).toBeUndefined();
	});
});

describe('composerAsUsual', () => {
	const known = ['Bach', 'Tschaikowsky', 'Händel', 'John Williams', 'Schostakowitsch'];
	it.each([
		['Pjotr Iljitsch Tschaikowski', 'Tschaikowsky'],
		['Johann Sebastian Bach', 'Bach'],
		['Georg Friedrich Händel', 'Händel'],
		['Dmitri Dmitrijewitsch Schostakowitsch', 'Schostakowitsch'],
		['John Williams', 'John Williams'],
		['Karl Jenkins', 'Karl Jenkins'],
		['Carl Philipp Emanuel Bach', 'Bach']
	])('%s → %s', (name, expected) => {
		expect(composerAsUsual(name, known)).toBe(expected);
	});
});

describe('suggestGenre', () => {
	const genres = ['Barock', 'Klassik', 'Romantik', 'Filmmusik', 'Musical', 'Weihnachten', 'Pop'];
	it.each([
		[{ kinds: ['Film'] }, 'Filmmusik'],
		[{ kinds: ['Musical'] }, 'Musical'],
		[{ category: 'Weihnachtsstücke' }, 'Weihnachten'],
		[{ year: 1700 }, 'Barock'],
		[{ year: 1788 }, 'Klassik'],
		[{ year: 1883 }, 'Romantik'],
		[{ year: 1995 }, undefined],
		[{ kinds: ['Ballett'] }, undefined]
	])('%j → %s', (hints, expected) => {
		expect(suggestGenre(hints, genres)).toBe(expected);
	});
});

describe('durationOf', () => {
	const quantity = (amount: string, unit: string) => ({ mainsnak: { datavalue: { value: { amount, unit: `http://www.wikidata.org/entity/${unit}` } } } });

	it('reads minutes, seconds and hours', () => {
		expect(durationOf({ P2047: [quantity('+25', 'Q7727')] })).toBe(1500);
		expect(durationOf({ P2047: [quantity('+450', 'Q11574')] })).toBe(450);
		expect(durationOf({ P2047: [quantity('+1.5', 'Q25235')] })).toBe(5400);
	});

	it('skips unknown units and missing claims', () => {
		expect(durationOf({ P2047: [quantity('+3', 'Q1'), quantity('+7', 'Q7727')] })).toBe(420);
		expect(durationOf({})).toBeUndefined();
	});
});
