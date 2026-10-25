import { describe, expect, it } from 'vitest';
import { eventOrchestra, isJoint, orchestraChoices, pickOrchestra, playedBy, programLabel, programScopes, rowOrchestra, titleOrchestra } from './orchestras.ts';

describe('orchestras of a programme row', () => {
	const concert = ['EO', 'A'];

	it('belongs to all of the concert’s orchestras unless it names one', () => {
		expect(rowOrchestra('', concert)).toBe('EO, A');
		expect(rowOrchestra('', ['EO'])).toBe('EO');
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

describe('orchestras a rehearsal is for', () => {
	const orchestras = ['EO', 'A', 'B', 'Junges Orchester'];

	it('reads the orchestras its title names as whole words', () => {
		expect(titleOrchestra('Probe A', orchestras)).toBe('A');
		expect(titleOrchestra('Probe Herbstkonzert (A)', orchestras)).toBe('A');
		expect(titleOrchestra('Probe A + EO', orchestras)).toBe('EO, A');
		expect(titleOrchestra('Probe Herbstkonzert (EO, A) (?)', orchestras)).toBe('EO, A');
		expect(titleOrchestra('Stimmprobe Junges Orchester', orchestras)).toBe('Junges Orchester');
		expect(titleOrchestra('Probe junges orchester', orchestras)).toBe('Junges Orchester');
	});

	it('names none in ordinary titles', () => {
		expect(titleOrchestra('Probe Herbstkonzert', orchestras)).toBeUndefined();
		expect(titleOrchestra('Probe Mozart A-Dur', orchestras)).toBeUndefined();
		expect(titleOrchestra('Probe a cappella', orchestras)).toBeUndefined();
		expect(titleOrchestra('Probe B-Stimmen', orchestras)).toBeUndefined();
		expect(titleOrchestra('Probe Orchester', orchestras)).toBeUndefined();
		expect(titleOrchestra('Probe A', [])).toBeUndefined();
	});

	const concerts = new Map([
		['herbst', 'EO, A'],
		['sommer', undefined]
	]);
	const of = (event: Parameters<typeof eventOrchestra>[0]) => eventOrchestra(event, (id) => concerts.get(id));

	it('takes a rehearsal’s own orchestras first, else its concert’s', () => {
		expect(of({ id: 'p1', type: 'probe', concertId: 'herbst', orchestra: 'A' })).toBe('A');
		expect(of({ id: 'p2', type: 'probe', concertId: 'herbst' })).toBe('EO, A');
		expect(of({ id: 'p3', type: 'generalprobe', concertId: 'sommer' })).toBeUndefined();
		expect(of({ id: 'p4', type: 'probe' })).toBeUndefined();
		expect(of({ id: 'herbst', type: 'konzert' })).toBe('EO, A');
	});
});
