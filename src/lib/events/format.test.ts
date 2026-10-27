import { describe, expect, it } from 'vitest';
import { splitTrailingEmoji } from './format.ts';

describe('splitTrailingEmoji', () => {
	it('keeps the last word with the emoji after it', () => {
		expect(splitTrailingEmoji('Probe Herbstkonzert 🎶')).toEqual(['Probe ', 'Herbstkonzert 🎶']);
		expect(splitTrailingEmoji('Sommerfest 🎉🍹')).toEqual(['', 'Sommerfest 🎉🍹']);
		expect(splitTrailingEmoji('Generalprobe ❤️')).toEqual(['', 'Generalprobe ❤️']);
	});

	it('leaves titles without a trailing emoji alone', () => {
		expect(splitTrailingEmoji('Herbstkonzert')).toEqual(['Herbstkonzert', '']);
		expect(splitTrailingEmoji('🎶 Probe am Abend')).toEqual(['🎶 Probe am Abend', '']);
	});
});
