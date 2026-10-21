import { describe, expect, it } from 'vitest';
import { fileWords, instrumentLabel } from './instrument-label.ts';

describe('instrument labels', () => {
	it('shows the label where there is one', () => {
		expect(instrumentLabel('Viola')).toBe('Bratsche');
		expect(instrumentLabel('Violoncello')).toBe('Cello');
		expect(instrumentLabel('Geige')).toBe('Geige');
	});

	it('turns shown names back into the file names’ words, whole words only', () => {
		expect(fileWords('Bratsche')).toBe('Viola');
		expect(fileWords('Stimme 1: Geige & Bratsche')).toBe('Stimme 1: Geige & Viola');
		expect(fileWords('Cello II')).toBe('Violoncello II');
		expect(fileWords('Cellos')).toBe('Cellos');
	});
});
