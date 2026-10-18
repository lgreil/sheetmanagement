import { describe, expect, it } from 'vitest';
import { bachkreis } from '#lib/config/presets/bachkreis.ts';
import { createInstrumentMatcher, parsePartName } from './part-name.ts';
import { sharedPrefix } from './text.ts';

const matcher = createInstrumentMatcher(bachkreis.instruments);
const parse = (name: string, prefix = '', mimeType = 'application/pdf') =>
	parsePartName(name, mimeType, bachkreis.naming, matcher, prefix);

describe('parsePartName', () => {
	it.each([
		// The orchestra's own convention
		['BWV 147 - Geige II.pdf', 'Geige II', 'stimme'],
		['@BWV 147 - Partitur.pdf', 'Partitur', 'partitur'],
		['Sword Dance - Trompete I in B.pdf', 'Trompete I in B', 'stimme'],
		['Fame - Geige III / Viola.pdf', 'Geige III / Viola', 'sammelstimme'],
		['Fame - Pauke & Schlagwerk.pdf', 'Pauke & Schlagwerk', 'sammelstimme'],
		['Fame - Blech III in hoch B.pdf', 'Blech III in hoch B', 'stimme'],
		['Fame - C-Stimmen in Es.pdf', 'C-Stimmen in Es', 'stimme'],
		// Older styles
		['1. Violine.pdf', 'Geige I', 'stimme'],
		['2.Flöte.pdf', 'Flöte II', 'stimme'],
		['Horn in F 2.pdf', 'Horn II in F', 'stimme'],
		['Saxophon Eb 1+2.pdf', 'Saxophon I & II in Es', 'sammelstimme'],
		['Trompete 1-3.pdf', 'Trompete I–III', 'sammelstimme'],
		['Klarinette 1 & 2 B.pdf', 'Klarinette I & II in B', 'sammelstimme'],
		['Querfl”Te 1 & 2.pdf', 'Flöte I & II', 'sammelstimme'],
		['1. Trompete-1. Klarinette.pdf', 'Trompete I & Klarinette I', 'sammelstimme'],
		['Part 1 Violin.pdf', 'Stimme 1: Geige', 'stimme'],
		['Thriller - Part 4 + 5 Cello.pdf', 'Stimme 4 & 5: Violoncello', 'sammelstimme'],
		['Stimme 3 in B.pdf', 'Stimme 3 in B', 'stimme'],
		['Bariton B.C..pdf', 'Bariton', 'stimme'],
		['Kontrabass / Stringbass.pdf', 'Kontrabass', 'stimme'],
		['barbie-girl-HornI-and-HornII.pdf', 'Horn I & II', 'sammelstimme']
	])('%s → %s', (fileName, label, kind) => {
		const part = parse(fileName);
		expect(part.label).toBe(label);
		expect(part.kind).toBe(kind);
	});

	it('strips the title shared by all files of a piece', () => {
		const files = ['Best_of_Bach-ViolinII.pdf', 'Best_of_Bach-ClarinetI.pdf', 'Best_of_Bach-Bass.pdf'];
		const prefix = sharedPrefix(files);
		expect(prefix).toBe('Best_of_Bach-');
		expect(files.map((f) => parse(f, prefix).label)).toEqual(['Geige II', 'Klarinette I', 'Kontrabass']);
		expect(parse('Sheeps-ClarinetI+II-Bb.pdf', 'Sheeps-').label).toBe('Klarinette I & II in B');
	});

	it('reads movements, flexible voices and voice parts', () => {
		expect(parse('Dvorak_9-4_Viola.pdf', 'Dvorak_9-')).toMatchObject({ label: 'Viola', notes: ['Satz 4'] });
		expect(parse('Te_Deum-3Es.pdf', 'Te_Deum-').label).toBe('Stimme 3 in Es');
		expect(parse('Te_Deum-1C.pdf', 'Te_Deum-').label).toBe('Stimme 1 in C');
		expect(parse('Transeamus-Gesang-SA.pdf', 'Transeamus-').label).toBe('Gesang SA');
		expect(parse('Section II ViolineII.pdf').label).toBe('Geige II');
	});

	it('reads status words, notes and featured parts', () => {
		expect(parse('Sword Dance - Partitur - FEHLT', '', 'application/vnd.google-apps.document')).toMatchObject({
			label: 'Partitur',
			status: 'missing'
		});
		expect(parse('Elegie - Viola - LEER.pdf').status).toBe('empty');
		expect(parse('Phantom-Synth-incomplete.pdf', 'Phantom-')).toMatchObject({ label: 'Synthesizer', status: 'incomplete' });
		expect(parse('Elegie - Viola vereinfacht.pdf').notes).toEqual(['vereinfacht']);
		expect(parse('Interstellar - Geige I - Bass-Fassung.pdf')).toMatchObject({ label: 'Geige I', notes: ['Bass-Fassung'] });
		expect(parse('@No Time to Die - Gesang.pdf')).toMatchObject({ kind: 'solo', featured: true });
		expect(parse('Barcarolle-Solo.pdf', 'Barcarolle-')).toMatchObject({ label: 'Solo', kind: 'solo' });
	});

	it('keeps unknown files readable and sorts the score first', () => {
		expect(parse('Avicii Medley - Klatschen.pdf')).toMatchObject({ label: 'Avicii Medley – Klatschen', kind: 'sonstiges' });
		expect(parse('Aufnahme.mp3', '', 'audio/mpeg').kind).toBe('audio');

		const order = ['Geige I.pdf', '@Partitur.pdf', 'Flöte II.pdf', 'Flöte I.pdf', 'Notizen.pdf']
			.map((name) => parse(name))
			.sort((a, b) => a.order - b.order)
			.map((part) => part.label);
		expect(order).toEqual(['Partitur', 'Flöte I', 'Flöte II', 'Geige I', 'Notizen']);
	});
});
