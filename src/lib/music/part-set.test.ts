import { describe, expect, it } from 'vitest';
import { config } from '#lib/config/index.ts';
import { parseInstruments } from './my-parts.ts';
import { createInstrumentMatcher, parsePartName } from './part-name.ts';
import { partSet } from './part-set.ts';
import type { Part } from './types.ts';

const matcher = createInstrumentMatcher(config.instruments);
let next = 0;
/** A part as the catalog builds it from a file name. */
function part(fileName: string): Part {
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
		section: '',
		order: parsed.order
	};
}

const players = (...entries: string[]) => entries.flatMap((entry) => parseInstruments(entry, config));
const copies = (set: ReturnType<typeof partSet>) => Object.fromEntries(set.map((entry) => [entry.label, [entry.players, entry.copies]]));

describe('partSet', () => {
	const parts = [
		part('Elegie - Partitur.pdf'),
		part('Elegie - Geige I.pdf'),
		part('Elegie - Geige II.pdf'),
		part('Elegie - Violoncello.pdf'),
		part('Elegie - Klarinette I & II in B.pdf'),
		part('Elegie - Oboe.pdf'),
		part('Elegie - Horn - FEHLT.pdf')
	];

	it('counts a copy per player, a desk per two strings, and the score once', () => {
		const set = partSet(parts, players('Geige I', 'Geige I', 'Geige I', 'Geige II', 'Cello', 'Cello', 'Klarinette I', 'Klarinette II', 'Oboe'), config);
		expect(copies(set)).toMatchObject({
			Partitur: [0, 1],
			'Geige I': [3, 2],
			'Geige II': [1, 1],
			Cello: [2, 1],
			'Klarinette I & II in B': [2, 2],
			Oboe: [1, 1]
		});
	});

	it('spreads players without a number over their instrument’s parts', () => {
		expect(copies(partSet(parts, players('Geige', 'Geige', 'Geige', 'Geige'), config))).toMatchObject({ 'Geige I': [2, 1], 'Geige II': [2, 1] });
	});

	it('prints nothing of a part marked missing, but still shows it', () => {
		const horn = partSet(parts, players('Horn'), config).find((entry) => entry.status !== 'ok');
		expect(horn).toMatchObject({ status: 'missing', copies: 0 });
	});
});
