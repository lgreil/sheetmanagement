import { describe, expect, it } from 'vitest';
import { serverTiming } from './timing.ts';

describe('serverTiming', () => {
	it('lists each part with its duration, to a tenth of a millisecond', () => {
		expect(serverTiming([['settings', 1.234], ['access', 0], ['page', 85.06]])).toBe('settings;dur=1.2, access;dur=0, page;dur=85.1');
	});
});
