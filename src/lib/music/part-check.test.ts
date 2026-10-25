import { describe, expect, it } from 'vitest';
import { partHints } from './part-check.ts';
import type { Part } from './types.ts';

const part = (id: string, kind: Part['kind'] = 'stimme', status: Part['status'] = 'ok', section = '') => ({ id, kind, status, section, mimeType: 'application/pdf' });
const counts = (entries: Record<string, number | null>) => new Map(Object.entries(entries));

describe('partHints', () => {
	const parts = [part('v1'), part('v2'), part('va'), part('vc'), part('score', 'partitur')];

	it('finds a part with far fewer pages than the others', () => {
		expect(partHints(parts, counts({ v1: 6, v2: 6, va: 2, vc: 5, score: 40 }))).toEqual([{ id: 'va', problem: 'incomplete', pages: 2, usual: 6 }]);
	});

	it('finds unreadable files and files without pages', () => {
		expect(partHints(parts, counts({ v1: 4, v2: null, va: 0, vc: 4 }))).toEqual([
			{ id: 'v2', problem: 'empty' },
			{ id: 'va', problem: 'empty' }
		]);
	});

	it('leaves alone what is close, short pieces and the score', () => {
		expect(partHints(parts, counts({ v1: 2, v2: 2, va: 1, vc: 2, score: 1 }))).toEqual([]);
		expect(partHints(parts, counts({ v1: 5, v2: 4, va: 3, vc: 5 }))).toEqual([]);
		expect(partHints([part('a'), part('b')], counts({ a: 8, b: 1 }))).toEqual([]);
	});

	it('skips parts whose name already says it, and dismissed hints', () => {
		const marked = [part('v1'), part('v2'), part('va', 'stimme', 'incomplete'), part('vc')];
		expect(partHints(marked, counts({ v1: 6, v2: 6, va: 1, vc: 6 }))).toEqual([]);
		expect(partHints(parts, counts({ v1: 6, v2: 6, va: 1, vc: 6 }), new Set(['va']))).toEqual([]);
	});

	it('compares parts within their section only', () => {
		const sections = [part('a1', 'stimme', 'ok', 'a'), part('a2', 'stimme', 'ok', 'a'), part('a3', 'stimme', 'ok', 'a'), part('b1', 'stimme', 'ok', 'b')];
		expect(partHints(sections, counts({ a1: 10, a2: 10, a3: 10, b1: 1 }))).toEqual([]);
	});
});
