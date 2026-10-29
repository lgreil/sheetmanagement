import { describe, expect, it } from 'vitest';
import { MARK_SYMBOLS, MAX_PAGE_POINTS, MAX_POINTS, MAX_STROKES, markLines, mergeMarks, pagePoints, parseStrokes, strokePath, symbolLines, thinPoints } from './marks.ts';

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

describe('symbols (#236)', () => {
	it('are one point each, with their name', () => {
		expect(parseStrokes([{ color: 'red', points: [0.5, 0.25], symbol: 'downbow' }])).toEqual([{ color: 'red', points: [0.5, 0.25], symbol: 'downbow' }]);
	});

	it('refuses a symbol it doesn’t know, or one with a line', () => {
		expect(parseStrokes([{ color: 'red', points: [0.5, 0.25], symbol: 'smiley' }])).toBeNull();
		expect(parseStrokes([{ color: 'red', points: [0.5, 0.25, 0.6, 0.3], symbol: 'p' }])).toBeNull();
	});

	it('draws every symbol as lines around its point, not stretched by the page', () => {
		for (const symbol of MARK_SYMBOLS) {
			const lines = symbolLines(symbol, 0.5, 0.5, 1);
			expect(lines.length).toBeGreaterThan(0);
			for (const line of lines) for (const n of line) expect(Math.abs(n - 0.5)).toBeLessThan(0.05);
		}
		// On a page twice as wide as high, a symbol spans twice the share of its height.
		const [wide] = symbolLines('upbow', 0.5, 0.5, 2);
		const [square] = symbolLines('upbow', 0.5, 0.5, 1);
		expect(wide[3] - wide[1]).toBeCloseTo(2 * (square[3] - square[1]), 6);
		expect(markLines({ color: 'red', points: [0, 0, 1, 1] }, 1)).toEqual([[0, 0, 1, 1]]);
	});
});

describe('a page’s room (#236)', () => {
	const line = (count: number) => ({ color: 'red', points: Array.from({ length: count }, (_, i) => [i / count, 0.5]).flat() });

	it('counts drawn points and symbols together', () => {
		expect(pagePoints([{ color: 'red', points: [0, 0, 1, 1] }, { color: 'red', points: [0, 0], symbol: 'p' }])).toBe(3);
	});

	it('takes a full page, not more', () => {
		expect(parseStrokes([line(MAX_PAGE_POINTS / 2), line(MAX_PAGE_POINTS / 2)])).not.toBeNull();
		expect(parseStrokes([line(MAX_PAGE_POINTS / 2), line(MAX_PAGE_POINTS / 2), { color: 'red', points: [0, 0], symbol: 'p' }])).toBeNull();
	});
});

describe('mergeMarks', () => {
	const mark = (x: number) => ({ color: 'red' as const, points: [x, 0.5], symbol: 'p' as const });

	it('adds what isn’t there yet, in order', () => {
		expect(mergeMarks([mark(0.1)], [mark(0.1), mark(0.2)])).toEqual({ strokes: [mark(0.1), mark(0.2)], skipped: 0 });
	});

	it('stops where the page is full', () => {
		const full = Array.from({ length: MAX_STROKES }, (_, i) => mark(i / MAX_STROKES));
		expect(mergeMarks(full, [mark(2)])).toEqual({ strokes: full, skipped: 1 });
	});
});
