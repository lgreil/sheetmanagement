import { describe, expect, it } from 'vitest';
import { shortDateLabel } from './dates.ts';

describe('shortDateLabel', () => {
	it('is short for a day of this year, with the year for another', () => {
		expect(shortDateLabel('2026-11-19', '2026-10-25', 'de-DE')).toBe('19. Nov.');
		expect(shortDateLabel('2027-04-18', '2026-10-25', 'de-DE')).toBe('18. Apr. 2027');
		expect(shortDateLabel('2026-11-19', '2026-10-25', 'en-GB')).toBe('19 Nov');
	});

	it('names the month or the year when the date has no day', () => {
		expect(shortDateLabel('2026-12', '2026-10-25', 'de-DE')).toBe('Dez. 2026');
		expect(shortDateLabel('1987', '2026-10-25', 'de-DE')).toBe('1987');
		expect(shortDateLabel('', '2026-10-25', 'de-DE')).toBe('');
	});
});
