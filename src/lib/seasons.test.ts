import { describe, expect, it } from 'vitest';
import { seasonOf } from './seasons.ts';

describe('seasonOf', () => {
	it('follows the year, with Advent, New Year and the week before Halloween on their own', () => {
		expect(
			['2026-01-01', '2026-01-02', '2026-02-28', '2026-03-01', '2026-06-21', '2026-09-01', '2026-10-23', '2026-10-24', '2026-10-31', '2026-11-01', '2026-12-01', '2026-12-26', '2026-12-27', '2026-12-31'].map(seasonOf)
		).toEqual(['newYear', 'winter', 'winter', 'spring', 'summer', 'autumn', 'autumn', 'halloween', 'halloween', 'autumn', 'advent', 'advent', 'winter', 'newYear']);
	});
});
