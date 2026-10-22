import { describe, expect, it } from 'vitest';
import { ALL_ON, featureOfPath, resolveFeatures } from './features.ts';

describe('resolveFeatures', () => {
	it('has everything on by default', () => {
		expect(resolveFeatures()).toEqual({ features: ALL_ON, unknown: [] });
	});

	it('turns off what FEATURES_OFF names, by key or German word, on top of the preset', () => {
		const { features, unknown } = resolveFeatures({ offline: false }, 'Leihmaterial, gema;anwesenheit  calendarFeed');
		expect(Object.entries(features).filter(([, on]) => !on).map(([key]) => key).sort()).toEqual(
			['attendance', 'calendarFeed', 'loans', 'musicReport', 'offline'].sort()
		);
		expect(unknown).toEqual([]);
	});

	it('returns words that name no feature', () => {
		expect(resolveFeatures({}, 'leihmaterial, gemma').unknown).toEqual(['gemma']);
	});
});

describe('featureOfPath', () => {
	it('knows the pages and files of each feature', () => {
		expect(featureOfPath('/leihmaterial')).toBe('loans');
		expect(featureOfPath('/wuensche')).toBe('wishes');
		expect(featureOfPath('/kalender/abc.ics')).toBe('calendarFeed');
		expect(featureOfPath('/konzerte/abc/anwesenheit')).toBe('attendance');
		expect(featureOfPath('/konzerte/abc/anwesenheit/__data.json')).toBe('attendance');
		expect(featureOfPath('/konzerte/abc/musikfolge.csv')).toBe('musicReport');
	});

	it('leaves every other page alone', () => {
		for (const path of ['/', '/konzerte', '/konzerte/abc', '/konzerte/abc/drucken', '/leihmaterialien', '/stuecke/wuensche']) {
			expect(featureOfPath(path)).toBeUndefined();
		}
	});
});
