import { afterEach, describe, expect, it } from 'vitest';
import { instrumentLabel, fileWords } from '#lib/music/instrument-label.ts';
import { createInstrumentMatcher, parsePartName } from '#lib/music/part-name.ts';
import { config, PRESET_INSTRUMENTS, useInstrumentOverrides } from './index.ts';

describe('useInstrumentOverrides (#143)', () => {
	afterEach(() => useInstrumentOverrides({}));

	it('changes the labels the app shows, and back', () => {
		useInstrumentOverrides({ Geige: { label: 'Violine' }, Viola: { label: 'Viola' } });
		expect(instrumentLabel('Geige')).toBe('Violine');
		// The file names' word itself: no label, so "Viola" shows as "Viola".
		expect(instrumentLabel('Viola')).toBe('Viola');
		expect(fileWords('Violine II')).toBe('Geige II');
		useInstrumentOverrides({});
		expect(instrumentLabel('Viola')).toBe('Bratsche');
		expect(config.instruments).toBe(PRESET_INSTRUMENTS);
	});

	it('adds spellings that file names are recognised by', () => {
		const before = parsePartName('Fiedel 1.pdf', 'application/pdf', config.naming, createInstrumentMatcher(config.instruments));
		useInstrumentOverrides({ Geige: { aliases: ['Fiedel'] } });
		const after = parsePartName('Fiedel 1.pdf', 'application/pdf', config.naming, createInstrumentMatcher(config.instruments));
		expect(before.instruments).not.toContain('Geige');
		expect(after.instruments).toContain('Geige');
	});
});
