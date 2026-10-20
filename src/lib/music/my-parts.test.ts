import { describe, expect, it } from 'vitest';
import { config } from '#lib/config/index.ts';
import { coverage, formatInstrument, matchParts, mergedFileName, parseInstrument, playedParts, programInstruments } from './my-parts.ts';
import { createInstrumentMatcher, parsePartName } from './part-name.ts';
import type { Part } from './types.ts';

const matcher = createInstrumentMatcher(config.instruments);
let next = 0;
/** A part as the catalog builds it from a file name. */
function part(fileName: string, section = ''): Part {
	const parsed = parsePartName(fileName, 'application/pdf', config.naming, matcher);
	return {
		id: `f${next++}`,
		fileName,
		label: parsed.label,
		kind: parsed.kind,
		family: parsed.family,
		instruments: parsed.instruments,
		voices: parsed.voices,
		notes: parsed.notes,
		status: parsed.status,
		mimeType: 'application/pdf',
		section,
		order: parsed.order
	};
}
const labels = (parts: Part[]) => parts.map((p) => p.label);

describe('parseInstrument', () => {
	it.each([
		['Geige 2', { instrument: 'Geige', number: 2 }],
		['2. Violine', { instrument: 'Geige', number: 2 }],
		['Violin II', { instrument: 'Geige', number: 2 }],
		['Cello', { instrument: 'Violoncello' }],
		['Klarinette in B', { instrument: 'Klarinette' }],
		['Dirigent', { instrument: 'Partitur' }],
		['Tröte', null],
		['', null]
	])('%j → %j', (text, expected) => {
		expect(parseInstrument(text, config)).toEqual(expected);
	});

	it('formats a choice like a part name', () => {
		expect(formatInstrument({ instrument: 'Geige', number: 2 })).toBe('Geige II');
		expect(formatInstrument({ instrument: 'Viola' })).toBe('Viola');
	});
});

describe('matchParts', () => {
	const parts = [
		part('Bolero - Partitur.pdf'),
		part('Bolero - Geige I.pdf'),
		part('Bolero - Geige II.pdf'),
		part('Bolero - Violoncello & Kontrabass.pdf'),
		part('Bolero - Klarinette I & II in B.pdf'),
		part('Bolero - B-Stimmen.pdf'),
		part('Bolero - C-Stimmen.pdf'),
		part('Bolero - Aufnahme.mp3')
	];

	it('finds the part with the right number', () => {
		expect(labels(matchParts(parts, { instrument: 'Geige', number: 2 }, config).own)).toEqual(['Geige II']);
	});

	it('gives every part of the instrument when no number is known', () => {
		expect(labels(matchParts(parts, { instrument: 'Geige' }, config).own)).toEqual(['Geige I', 'Geige II']);
	});

	it('finds combined parts and the shared parts for the instrument', () => {
		const clarinet = matchParts(parts, { instrument: 'Klarinette', number: 2 }, config);
		expect(labels(clarinet.own)).toEqual(['Klarinette I & II in B']);
		expect(labels(clarinet.shared)).toEqual(['B-Stimmen']);
		expect(labels(matchParts(parts, { instrument: 'Kontrabass' }, config).own)).toEqual(['Violoncello & Kontrabass']);
	});

	it('prefers the numbered part over a plain one, and leaves out the soloist', () => {
		// As in the archive: "Lets_get_Loud-Violin.pdf" next to "…-ViolinII.pdf", and a solo violin.
		const loud = [part('Loud - Violin.pdf'), part('Loud - Violin II.pdf'), part('Loud - Violin III.pdf'), part('@Loud - Violine Solo.pdf')];
		expect(labels(matchParts(loud, { instrument: 'Geige', number: 2 }, config).own)).toEqual(['Geige II']);
		// Without "Geige IV", the plain part is the best there is.
		expect(labels(matchParts(loud, { instrument: 'Geige', number: 4 }, config).own)).toEqual(['Geige']);
		expect(labels(matchParts([part('Loud - Violine Solo.pdf')], { instrument: 'Geige', number: 2 }, config).own)).toEqual(['Geige']);
	});

	it('gives the conductor the score', () => {
		expect(labels(matchParts(parts, { instrument: 'Partitur' }, config).own)).toEqual(['Partitur']);
	});

	it('finds nothing for an instrument the piece lacks', () => {
		expect(matchParts(parts, { instrument: 'Tuba' }, config)).toEqual({ own: [], shared: [] });
	});

	it('only uses the section that is played', () => {
		const detail = {
			sections: [{ key: 'played' }, { key: 'complete' }] as never,
			parts: [part('Sinfonie - Geige I.pdf', 'played'), part('Sinfonie - Geige I.pdf', 'complete'), part('Sinfonie - Aufnahme.mp3', 'played')]
		};
		expect(playedParts(detail).map((p) => p.section)).toEqual(['played']);
	});
});

describe('instrumentation check', () => {
	const parts = [
		part('Elegie - Geige I.pdf'),
		part('Elegie - Viola - FEHLT.pdf'),
		part('Elegie - B-Stimmen.pdf'),
		part('Elegie - Violoncello.pdf')
	];

	it.each([
		['Geige', 'own'],
		['Trompete', 'shared'],
		['Viola', 'problem'],
		['Tuba', 'none']
	])('%s → %s', (instrument, expected) => {
		expect(coverage(parts, instrument, config)).toBe(expected);
	});

	it('lists the instruments of a programme in the configured order, without group parts', () => {
		const other = [part('Bolero - Partitur.pdf'), part('Bolero - Flöte.pdf'), part('Bolero - Schlagwerk.pdf'), part('Bolero - Holz.pdf')];
		expect(programInstruments([parts, other], config)).toEqual(['Flöte', 'Schlagwerk', 'Geige', 'Viola', 'Violoncello']);
	});
});

describe('mergedFileName', () => {
	it('names the merged PDF after concert and instrument, without spaces or umlauts', () => {
		expect(mergedFileName('Herbstkonzert', 'Violoncello')).toBe('herbstkonzert-komplett-violoncello.pdf');
		expect(mergedFileName('1. Weihnachtskonzert 2026', 'Flöte II')).toBe('1-weihnachtskonzert-2026-komplett-floete-ii.pdf');
		expect(mergedFileName('Konzert', 'Alt-Saxophon')).toBe('konzert-komplett-alt-saxophon.pdf');
	});
});
