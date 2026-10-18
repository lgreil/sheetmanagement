import { describe, expect, it } from 'vitest';
import { archiveGaps, doneFileIds, isDone, planMissingParts, type Gap } from './missing-parts.ts';

const HEADER = ['Stück', 'Stimme', 'Status', 'Datei-ID', 'erledigt'];
const gap = (fileId: string, status: Gap['status'] = 'missing', piece = 'Bolero', part = `Stimme ${fileId}`): Gap => ({
	fileId,
	piece,
	part,
	status
});
const row = (g: Gap, done = '') => [g.piece, g.part, { missing: 'fehlt', empty: 'leer', incomplete: 'unvollständig' }[g.status], g.fileId, done];

describe('archiveGaps', () => {
	it('lists missing, empty and incomplete parts, but not recordings or other files', () => {
		const gaps = archiveGaps(
			[
				{
					id: 'p1',
					title: 'Bolero',
					parts: [
						{ id: 'a', label: 'Flöte', status: 'missing', kind: 'stimme' },
						{ id: 'b', label: 'Oboe', status: 'ok', kind: 'stimme' },
						{ id: 'c', label: 'Aufnahme', status: 'missing', kind: 'audio' },
						{ id: 'd', label: 'Notizen', status: 'empty', kind: 'sonstiges' },
						{ id: 'e', label: 'Horn', status: 'incomplete', kind: 'stimme' }
					]
				}
			],
			(id) => (id === 'p1' ? 'Boléro' : undefined)
		);
		expect(gaps).toEqual([
			{ fileId: 'a', piece: 'Boléro', part: 'Flöte', status: 'missing' },
			{ fileId: 'e', piece: 'Boléro', part: 'Horn', status: 'incomplete' }
		]);
	});
});

describe('isDone', () => {
	it('reads checkboxes in English and German sheets and typed marks', () => {
		for (const value of ['TRUE', 'WAHR', 'x', ' ja ', 'erledigt']) expect(isDone(value)).toBe(true);
		for (const value of ['', 'FALSE', 'FALSCH', 'nein']) expect(isDone(value)).toBe(false);
	});
});

describe('planMissingParts', () => {
	it('fills an empty tab', () => {
		const plan = planMissingParts([HEADER], [gap('a'), gap('b', 'empty')]);
		expect(plan.changed).toBe(true);
		expect(plan.added.map((g) => g.fileId)).toEqual(['a', 'b']);
		expect(plan.removed).toEqual([]);
		expect(plan.body).toEqual([
			['Bolero', 'Stimme a', 'fehlt', 'a', false],
			['Bolero', 'Stimme b', 'leer', 'b', false]
		]);
	});

	it('changes nothing when the tab already matches', () => {
		const gaps = [gap('a'), gap('b')];
		const plan = planMissingParts([HEADER, row(gaps[0], 'TRUE'), row(gaps[1])], gaps);
		expect(plan.changed).toBe(false);
		expect(plan.kept.map((k) => [k.row, k.done])).toEqual([
			[2, true],
			[3, false]
		]);
		expect(plan.done).toEqual(['a']);
	});

	it('removes fixed gaps, appends new ones and keeps "erledigt" on rows that stay', () => {
		const [a, b, c, d] = [gap('a'), gap('b'), gap('c'), gap('d')];
		const e = gap('e');
		const plan = planMissingParts([HEADER, row(a, 'TRUE'), row(b, 'TRUE'), row(c, 'WAHR'), row(e)], [c, a, d]);
		expect(plan.removed).toEqual([3, 5]);
		expect(plan.added).toEqual([d]);
		expect(plan.kept.map((k) => k.gap.fileId)).toEqual(['a', 'c']);
		expect(plan.done).toEqual(['a', 'c']);
		// Kept rows stay in sheet order, the new one follows, and the last row is cleared.
		expect(plan.body).toEqual([
			['Bolero', 'Stimme a', 'fehlt', 'a', true],
			['Bolero', 'Stimme c', 'fehlt', 'c', true],
			['Bolero', 'Stimme d', 'fehlt', 'd', false],
			['', '', '', '', '']
		]);
	});

	it('clears the whole tab when every gap is fixed', () => {
		const plan = planMissingParts([HEADER, row(gap('a')), [], row(gap('b'))], []);
		expect(plan.changed).toBe(true);
		expect(plan.removed).toEqual([2, 4]);
		expect(plan.body).toEqual(Array(3).fill(['', '', '', '', '']));
	});

	it('updates a row whose status or piece name changed', () => {
		const plan = planMissingParts([HEADER, row(gap('a', 'missing'), 'TRUE')], [gap('a', 'incomplete', 'Boléro')]);
		expect(plan.changed).toBe(true);
		expect(plan.added).toEqual([]);
		expect(plan.removed).toEqual([]);
		expect(plan.body).toEqual([['Boléro', 'Stimme a', 'unvollständig', 'a', true]]);
	});

	it('drops rows without a file id and repeated file ids', () => {
		const a = gap('a');
		const plan = planMissingParts([HEADER, ['von Hand', '', '', '', ''], row(a), row(a, 'TRUE')], [a]);
		expect(plan.removed).toEqual([2, 4]);
		expect(plan.kept.map((k) => k.row)).toEqual([3]);
	});

	it('follows the columns wherever they are and keeps extra columns with their row', () => {
		const header = ['Datei-ID', 'erledigt', 'Notiz', 'Stück', 'Stimme', 'Status'];
		const [a, b] = [gap('a'), gap('b')];
		const plan = planMissingParts(
			[header, ['b', '', 'kommt bald', b.piece, b.part, 'fehlt'], ['x', 'TRUE', 'weg', 'Alt', 'Alt', 'fehlt']],
			[a, b]
		);
		expect(plan.body).toEqual([
			['b', false, 'kommt bald', 'Bolero', 'Stimme b', 'fehlt'],
			['a', false, '', 'Bolero', 'Stimme a', 'fehlt']
		]);
	});

	it('writes nothing when a column is missing', () => {
		const plan = planMissingParts([['Stück', 'Stimme', 'Status', 'erledigt']], [gap('a')]);
		expect(plan.ok).toBe(false);
		expect(plan.changed).toBe(false);
	});
});

describe('doneFileIds', () => {
	it('reads the ticked rows as they are', () => {
		expect(doneFileIds([HEADER, row(gap('a'), 'TRUE'), row(gap('b')), ['', '', '', '', 'TRUE']])).toEqual(['a']);
		expect(doneFileIds([])).toEqual([]);
	});
});
