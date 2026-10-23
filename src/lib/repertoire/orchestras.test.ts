import { describe, expect, it } from 'vitest';
import { isJoint, orchestraChoices, pickOrchestra, playedBy, programLabel, programScopes, rowOrchestra } from './orchestras.ts';

describe('orchestras of a programme row', () => {
	const concert = ['EO', 'A'];

	it('belongs to the first orchestra unless it names one', () => {
		expect(rowOrchestra('', concert)).toBe('EO');
		expect(rowOrchestra('a', concert)).toBe('A');
		expect(rowOrchestra('', [])).toBeUndefined();
	});

	it('writes pieces played together one way, in the concert’s order', () => {
		expect(rowOrchestra('a, eo', concert)).toBe('EO, A');
		expect(rowOrchestra('A; EO; A', concert)).toBe('EO, A');
		expect(isJoint(rowOrchestra('A, EO', concert))).toBe(true);
	});

	it('counts a joint piece for each of its orchestras', () => {
		expect(playedBy('EO, A', 'A')).toBe(true);
		expect(playedBy('EO, A', 'EO')).toBe(true);
		expect(playedBy('EO', 'A')).toBe(false);
		expect(playedBy(undefined, undefined)).toBe(true);
	});
});

describe('programmes to edit', () => {
	it('has a tab for playing together only with several orchestras', () => {
		expect(programScopes(['EO', 'A'])).toEqual(['EO', 'A', 'EO, A']);
		expect(programScopes(['EO'])).toEqual(['EO']);
	});

	it('opens the one asked for, else the first orchestra’s', () => {
		expect(pickOrchestra(['EO', 'A'], 'a, eo')).toBe('EO, A');
		expect(pickOrchestra(['EO', 'A'], 'A')).toBe('A');
		expect(pickOrchestra(['EO', 'A'], 'B')).toBe('EO');
		expect(pickOrchestra(['EO', 'A'], null)).toBe('EO');
	});

	it('names them', () => {
		expect(programLabel('EO')).toBe('Programm EO');
		expect(programLabel('EO, A')).toBe('Gemeinsam: EO + A');
	});
});

describe('orchestraChoices', () => {
	it('offers each orchestra, then the combinations', () => {
		expect(orchestraChoices(['EO', 'A', 'B'])).toEqual(['EO', 'A', 'B', 'EO, A', 'EO, B', 'A, B', 'EO, A, B']);
		expect(orchestraChoices(['EO'])).toEqual(['EO']);
	});
});
