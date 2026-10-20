import { describe, expect, it } from 'vitest';
import { config } from '#lib/config/index.ts';
import { readInstrumentGroups, toSharedParts } from './instrument-groups.ts';
import { matchParts, sharedPartsFor } from './my-parts.ts';
import { createInstrumentMatcher, parsePartName } from './part-name.ts';
import type { Part } from './types.ts';

const HEADER = ['Stimme', 'Gespielt von', 'Gegenseitig', 'Notiz'];
const names = config.instruments.map((instrument) => instrument.name);

describe('readInstrumentGroups', () => {
	it('is null for a missing or empty tab, so the defaults apply', () => {
		expect(readInstrumentGroups(undefined, names)).toBeNull();
		expect(readInstrumentGroups([HEADER], names)).toBeNull();
	});

	it('reads one-way and mutual rows, matching names ignoring case', () => {
		const groups = readInstrumentGroups(
			[HEADER, ['B-Stimmen', 'klarinette, Trompete', '', ''], ['Percussion', 'Schlagwerk, Mallet Percussion', 'TRUE', 'bei uns eins'], ['Holz', 'Blockflöte, Dudelsack', 'FALSE', '']],
			names
		)!;
		expect(groups.sharedParts['B-Stimmen']).toEqual(['Klarinette', 'Trompete']);
		expect(groups.sharedParts['Mallet Percussion']).toEqual(expect.arrayContaining(['Percussion', 'Schlagwerk']));
		expect(groups.sharedParts['Schlagwerk']).toEqual(expect.arrayContaining(['Percussion', 'Mallet Percussion']));
		// One way only: clarinets read the B part, not the other way round.
		expect(groups.sharedParts['Klarinette']).toBeUndefined();
		expect(groups.unknown).toEqual(['Dudelsack']);
		expect(groups.groups[1]).toMatchObject({ row: 3, mutual: true, note: 'bei uns eins' });
	});
});

describe('groups in Meine Noten', () => {
	it('gives a percussionist the mallet part once the group is mutual', () => {
		const matcher = createInstrumentMatcher(config.instruments);
		const part = (name: string, id: string): Part => {
			const parsed = parsePartName(name, 'application/pdf', config.naming, matcher);
			return { id, fileName: name, mimeType: 'application/pdf', section: '', subfolder: undefined, ...parsed } as unknown as Part;
		};
		const parts = [part('Fame - Mallet Percussion.pdf', 'm'), part('Fame - Geige I.pdf', 'g')];
		const groups = toSharedParts([{ part: 'Percussion', players: ['Schlagwerk', 'Mallet Percussion'], mutual: true }]);
		const withGroups = { ...config, sharedParts: groups };
		expect(sharedPartsFor('Schlagwerk', withGroups)).toContain('Mallet Percussion');
		expect(matchParts(parts, { instrument: 'Schlagwerk' }, withGroups).shared.map((p) => p.id)).toEqual(['m']);
	});
});
