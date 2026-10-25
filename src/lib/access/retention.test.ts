import { describe, expect, it } from 'vitest';
import { pseudonym } from './erase.ts';
import { entryDay, planRetention, retentionCutoff } from './retention.ts';

describe('retentionCutoff', () => {
	it('keeps the current season and the ones before it', () => {
		expect(retentionCutoff('2026-10-25', 1)).toBe('2026-09-01');
		expect(retentionCutoff('2026-10-25', 3)).toBe('2024-09-01');
		// Before September, the season began the year before.
		expect(retentionCutoff('2026-05-02', 1)).toBe('2025-09-01');
		expect(retentionCutoff('2026-09-01', 2)).toBe('2025-09-01');
	});
});

describe('entryDay', () => {
	it('takes the calendar, then the answer, then the year in the label', () => {
		expect(entryDay('2024-03-02', '2024-02-20', 'Probe · 2. März 2024')).toBe('2024-03-02');
		expect(entryDay(undefined, '2024-02-20', '')).toBe('2024-02-20');
		expect(entryDay(undefined, '', 'Probe · Samstag, 2. März 2019')).toBe('2019-12-31');
		expect(entryDay(undefined, undefined, 'Probe')).toBeUndefined();
	});
});

describe('planRetention', () => {
	const rows = [
		{ row: 2, values: { who: 'mia@example.org', name: 'Mia', day: '2023-05-01', comment: 'später' } },
		{ row: 3, values: { who: 'ben@example.org', name: 'Ben', day: '2025-10-01', comment: '' } },
		{ row: 4, values: { who: pseudonym('old'), name: 'Ohne Namen', day: '2020-01-01', comment: '' } },
		{ row: 5, values: { who: 'ada@example.org', name: 'Ada', day: '', comment: '' } }
	];
	let n = 0;
	const options = { anonymous: 'Ohne Namen', newId: () => `id${++n}`, clear: ['comment'] };

	it('rewrites old rows only, each with a pseudonym of its own', () => {
		n = 0;
		expect(planRetention(rows, (values) => values.day || undefined, '2024-09-01', options)).toEqual([
			{ row: 2, values: { who: pseudonym('id1'), name: 'Ohne Namen', comment: '' } }
		]);
	});

	it('stops at the limit', () => {
		expect(planRetention(rows, (values) => values.day || undefined, '2030-01-01', { ...options, limit: 1 })).toHaveLength(1);
	});
});
