import { describe, expect, it } from 'vitest';
import { buildRehearsalPlan, parsePlanEdit, planRehearsalSave, planVersion } from './plan.ts';

const HEADER = ['Probe', 'Stück', 'Notiz', 'Termin-ID'];

function sample() {
	return buildRehearsalPlan([
		HEADER,
		['Probe · Sa. 24.10.', 'Sleigh Ride', 'nur Schluss', 'probe-1'],
		['Probe · Sa. 24.10.', 'Bolero', '', 'probe-1'],
		['Probe · Sa. 24.10.', 'sleigh ride', '', 'probe-1'],
		['', 'Bolero', '', 'probe-2'],
		['ohne ID', 'Bolero', '', '']
	]);
}

describe('buildRehearsalPlan', () => {
	it('groups pieces by event id, each piece once', () => {
		const plan = sample();
		expect(plan.byEvent.get('probe-1')).toEqual([
			{ row: 2, pieceName: 'Sleigh Ride', notes: 'nur Schluss' },
			{ row: 3, pieceName: 'Bolero', notes: undefined }
		]);
		expect(plan.byEvent.get('probe-2')?.map((p) => p.pieceName)).toEqual(['Bolero']);
		expect([...plan.byEvent.keys()]).toEqual(['probe-1', 'probe-2']);
	});
});

describe('parsePlanEdit', () => {
	const ids = new Set(['probe-1', 'probe-2']);

	it('accepts lists of piece names for known rehearsals', () => {
		expect(parsePlanEdit('{"probe-1":[" Bolero ","Bolero","Sleigh Ride"],"probe-2":[]}', ids)).toEqual({
			'probe-1': ['Bolero', 'Sleigh Ride'],
			'probe-2': []
		});
	});

	it.each(['', '[]', '{"other":[]}', '{"probe-1":"Bolero"}', '{"probe-1":[""]}', '{"probe-1":[1]}'])('rejects %j', (json) => {
		expect(parsePlanEdit(json, ids)).toBeNull();
	});
});

describe('planRehearsalSave', () => {
	it('keeps rows that stay, removes the rest and appends new pieces', () => {
		const { table } = sample();
		const plan = planRehearsalSave(table, { 'probe-1': ['Sleigh Ride', 'Stille Nacht'], 'probe-2': [] }, { 'probe-1': 'Probe · Sa. 24.10.' });
		// Row 2 (with its note) stays; Bolero and the doubled Sleigh Ride go, as does probe-2's row.
		expect(plan.remove).toEqual([3, 4, 5]);
		expect(plan.append).toEqual([{ rehearsal: 'Probe · Sa. 24.10.', piece: 'Stille Nacht', eventId: 'probe-1' }]);
	});

	it('leaves rehearsals that were not edited alone', () => {
		const { table } = sample();
		expect(planRehearsalSave(table, { 'probe-2': ['Bolero'] }, {})).toEqual({ append: [], remove: [] });
	});
});

describe('planVersion', () => {
	it('changes when a row of these rehearsals changes, not others', () => {
		const before = planVersion(sample().table, ['probe-2']);
		const other = buildRehearsalPlan([HEADER, ['', 'Bolero', '', 'probe-2'], ['', 'Neu', '', 'probe-1']]);
		expect(planVersion(other.table, ['probe-2'])).toBe(before);
		const changed = buildRehearsalPlan([HEADER, ['', 'Bolero', 'Notiz', 'probe-2']]);
		expect(planVersion(changed.table, ['probe-2'])).not.toBe(before);
	});
});
