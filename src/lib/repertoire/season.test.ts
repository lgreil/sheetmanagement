import { describe, expect, it } from 'vitest';
import type { ChronicleConcert } from './chronicle.ts';
import { inPeriod, lastTwelveMonths, readPeriod, seasonReport } from './season.ts';

const period = { from: '2025-09-01', to: '2026-08-31' };

describe('inPeriod', () => {
	it('takes days, months and years that overlap the period', () => {
		expect(inPeriod('2025-09-01', period)).toBe(true);
		expect(inPeriod('2026-08-31', period)).toBe(true);
		expect(inPeriod('2025-08-31', period)).toBe(false);
		expect(inPeriod('2025-09', period)).toBe(true);
		expect(inPeriod('2025-08', period)).toBe(false);
		expect(inPeriod('2026', period)).toBe(true);
		expect(inPeriod('2024', period)).toBe(false);
		expect(inPeriod('', period)).toBe(false);
	});
});

describe('readPeriod', () => {
	it('defaults to the last twelve months', () => {
		expect(lastTwelveMonths('2026-10-22')).toEqual({ from: '2025-10-23', to: '2026-10-22' });
		expect(readPeriod(null, null, '2026-10-22')).toEqual({ from: '2025-10-23', to: '2026-10-22' });
		expect(lastTwelveMonths('2028-02-29')).toEqual({ from: '2027-03-02', to: '2028-02-29' });
	});

	it('keeps valid days, turns a backwards period round and drops nonsense', () => {
		expect(readPeriod('2026-08-31', '2025-09-01', '2026-10-22')).toEqual(period);
		expect(readPeriod('2026-02-31', 'gestern', '2026-10-22')).toEqual({ from: '2025-10-23', to: '2026-10-22' });
	});
});

const concert = (id: string, dateKey: string, titles: string[]): ChronicleConcert => ({
	id,
	title: id,
	dateKey,
	program: titles.map((title) => ({ title, pieceId: title.toLowerCase() }))
});

describe('seasonReport', () => {
	const report = seasonReport({
		period,
		concerts: [
			concert('Sommer 2024', '2024-07-01', ['Egmont']),
			concert('Herbst 2025', '2025-11-16', ['Egmont', 'Bolero']),
			concert('Frühjahr 2026', '2026-04', ['Bolero', 'Nachtmusik']),
			concert('Herbst 2026', '2026-11-15', ['Sleigh Ride'])
		],
		rehearsals: [
			{ id: 'a', day: '2025-08-30', attendance: { present: 1, of: 10 } },
			{ id: 'b', day: '2025-10-01', attendance: { present: 8, of: 10 } },
			{ id: 'c', day: '2025-10-08', attendance: { present: 7, of: 10 } },
			{ id: 'd', day: '2026-03-01' }
		],
		reports: [
			{ reportedAt: '2025-10-02', done: true },
			{ reportedAt: '2026-01-02 12:00', done: false },
			{ reportedAt: '2024-01-01', done: true },
			{ reportedAt: 'irgendwann', done: true }
		],
		wishes: [{ submittedAt: '2026-05-01' }, { submittedAt: '2020-05-01' }]
	});

	it('lists the concerts in the period, oldest first', () => {
		expect(report.concerts.map((c) => c.id)).toEqual(['Herbst 2025', 'Frühjahr 2026']);
		expect(report.pieces).toBe(3);
	});

	it('finds the pieces played for the first time', () => {
		expect(report.debuts).toEqual([
			{ title: 'Bolero', pieceId: 'bolero', concert: 'Herbst 2025' },
			{ title: 'Nachtmusik', pieceId: 'nachtmusik', concert: 'Frühjahr 2026' }
		]);
		expect(report.concerts[0].debuts).toEqual([1]);
	});

	it('counts rehearsals and their attendance as totals', () => {
		expect(report.rehearsals).toBe(3);
		expect(report.attendance).toEqual({ rehearsals: 2, average: 7.5, rate: 75 });
	});

	it('counts reports and wishes of the period', () => {
		expect(report.reports).toEqual({ made: 2, done: 1 });
		expect(report.wishes).toBe(1);
	});

	it('has no attendance when none was taken', () => {
		expect(seasonReport({ period, concerts: [], rehearsals: [{ id: 'd', day: '2026-03-01' }], reports: [], wishes: [] }).attendance).toBeNull();
	});
});
