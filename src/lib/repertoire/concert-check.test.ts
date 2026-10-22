import { describe, expect, it } from 'vitest';
import { concertCheck, type CheckInput } from './concert-check.ts';

const urls = { program: '/p', plan: '/plan', report: '/r', loans: '/l', gaps: '/g' };
const base: CheckInput = {
	past: false,
	program: [
		{ title: 'Egmont', status: 'ok', duration: 510, inReport: true },
		{ title: 'Morgenstimmung', status: 'missing', inReport: false }
	],
	rehearsals: 3,
	unplanned: 1,
	loans: [
		{ title: 'Egmont', dueBeforeConcert: true },
		{ title: 'Bolero', dueBeforeConcert: false }
	],
	urls
};
const summary = (input: CheckInput) => concertCheck(input).map((item) => [item.key, item.ok]);

describe('concertCheck', () => {
	it('lists what is done and what is open before a concert', () => {
		expect(summary(base)).toEqual([
			['program', true],
			['parts', false],
			['plan', false],
			['duration', false],
			['loans', false]
		]);
		expect(concertCheck(base).find((item) => item.key === 'loans')?.text).toContain('Egmont');
		expect(concertCheck(base).find((item) => item.key === 'loans')?.text).not.toContain('Bolero');
	});

	it('is all done with a complete programme', () => {
		const items = concertCheck({
			...base,
			program: [{ title: 'Egmont', status: 'ok', duration: 510, inReport: true }],
			unplanned: 0,
			loans: []
		});
		expect(items.every((item) => item.ok)).toBe(true);
		expect(items.find((item) => item.key === 'duration')?.text).toBe('Dauer ca. 9 Min.');
	});

	it('only asks for a programme while there is none, and skips the plan without rehearsals', () => {
		expect(summary({ ...base, program: [] })).toEqual([['program', false]]);
		expect(summary({ ...base, rehearsals: 0 }).map(([key]) => key)).not.toContain('plan');
	});

	it('after the concert: the music list and every loan still out', () => {
		expect(summary({ ...base, past: true })).toEqual([
			['report', false],
			['loans', false]
		]);
		expect(concertCheck({ ...base, past: true }).find((item) => item.key === 'loans')?.text).toContain('Bolero');
	});

	it('after the concert: no music list while it is turned off (#134)', () => {
		expect(summary({ ...base, past: true, urls: { ...urls, report: undefined } })).toEqual([['loans', false]]);
	});
});
