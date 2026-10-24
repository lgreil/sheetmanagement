import { describe, expect, it } from 'vitest';
import { MAX_POINTS, MAX_STROKES, parseStrokes, strokePath, thinPoints } from './marks.ts';

describe('parseStrokes', () => {
	it('takes strokes as the viewer sends them, rounded', () => {
		expect(parseStrokes([{ color: 'red', points: [0.123456, 0.5, 0.2, 0.6] }])).toEqual([{ color: 'red', points: [0.1235, 0.5, 0.2, 0.6] }]);
		expect(parseStrokes([])).toEqual([]);
	});

	it('refuses anything else', () => {
		expect(parseStrokes(null)).toBeNull();
		expect(parseStrokes('x')).toBeNull();
		expect(parseStrokes([{ color: 'green', points: [0, 0] }])).toBeNull();
		expect(parseStrokes([{ color: 'red', points: [0, 0, 0.5] }])).toBeNull();
		expect(parseStrokes([{ color: 'red', points: ['0', 0] }])).toBeNull();
		expect(parseStrokes(Array.from({ length: MAX_STROKES + 1 }, () => ({ color: 'red', points: [0, 0] })))).toBeNull();
		expect(parseStrokes([{ color: 'red', points: [0, Number.NaN] }])).toBeNull();
		// Other fields don't come along.
		expect(parseStrokes([{ color: 'blue', points: [0, 0], script: 'x' }])).toEqual([{ color: 'blue', points: [0, 0] }]);
	});
});

describe('parseStrokes, lenient where a pen is', () => {
	it('keeps a line drawn past the page’s edge, ending at the edge', () => {
		expect(parseStrokes([{ color: 'red', points: [0.9, 0.5, 1.3, 0.5, -0.2, 1.7] }])).toEqual([{ color: 'red', points: [0.9, 0.5, 1, 0.5, 0, 1] }]);
	});

	it('keeps a very long line, with fewer points', () => {
		const long = Array.from({ length: MAX_POINTS * 3 }, (_, i) => [i / (MAX_POINTS * 3), 0.5]).flat();
		const [stroke] = parseStrokes([{ color: 'blue', points: long }])!;
		expect(stroke.points.length).toBe(MAX_POINTS * 2);
		expect(stroke.points.slice(0, 2)).toEqual([0, 0.5]);
		expect(stroke.points.at(-2)).toBeCloseTo(1, 3);
	});
});

describe('thinPoints', () => {
	it('leaves out points too close together, keeping both ends', () => {
		const slow = Array.from({ length: 101 }, (_, i) => [i * 0.0005, 0.5]).flat();
		const thin = thinPoints(slow);
		expect(thin.length).toBeLessThan(slow.length / 3);
		expect(thin.slice(0, 2)).toEqual([0, 0.5]);
		expect(thin.slice(-2)).toEqual([0.05, 0.5]);
		expect(thinPoints([0, 0, 1, 1])).toEqual([0, 0, 1, 1]);
	});
});

describe('strokePath', () => {
	it('draws the points at the page’s size, a dot as a tiny line', () => {
		expect(strokePath([0, 0, 0.5, 1], 200, 100)).toBe('M0.0 0.0 L100.0 100.0');
		expect(strokePath([0.5, 0.5], 200, 100)).toBe('M100.0 50.0 l0.01 0');
	});
});
