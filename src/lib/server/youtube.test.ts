import { describe, expect, it } from 'vitest';
import { parseIsoDuration } from './youtube.ts';

describe('parseIsoDuration', () => {
	it('reads YouTube durations', () => {
		expect(parseIsoDuration('PT8M30S')).toBe(510);
		expect(parseIsoDuration('PT1H2M')).toBe(3720);
		expect(parseIsoDuration('PT45S')).toBe(45);
		expect(parseIsoDuration('P1DT1S')).toBe(86401);
	});

	it('has no length for live streams and nonsense', () => {
		expect(parseIsoDuration('P0D')).toBeUndefined();
		expect(parseIsoDuration('8:30')).toBeUndefined();
	});
});
