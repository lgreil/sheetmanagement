import { describe, expect, it } from 'vitest';
import { attendanceSummary, attendanceVersion, buildAttendance, parseTicks, planAttendanceSave } from './attendance.ts';

const values = [
	['Termin', 'Wer', 'Name', 'Anwesend', 'Termin-ID'],
	['Probe 1', 'anna@example.org', 'Anna', 'TRUE', 'p1'],
	['Probe 1', 'ben@example.org', 'Ben', 'FALSE', 'p1'],
	['Probe 1', 'Anna@example.org', 'Anna', 'FALSE', 'p1'],
	['Probe 2', 'anna@example.org', 'Anna', 'WAHR', 'p2'],
	['Probe 2', 'ben@example.org', 'Ben', 'x', 'p2']
];

describe('buildAttendance', () => {
	it('keeps one entry per person and rehearsal, the last row winning', () => {
		const { byEvent } = buildAttendance(values);
		expect(byEvent.get('p1')?.get('anna@example.org')).toMatchObject({ row: 4, present: false });
		expect(byEvent.get('p2')?.get('ben@example.org')?.present).toBe(true);
	});
});

describe('parseTicks', () => {
	const offered = new Map([
		['anna@example.org', 'Anna'],
		['ben@example.org', 'Ben']
	]);

	it('takes the names from the page, not the browser', () => {
		expect(parseTicks('[{"email":"ANNA@example.org","present":true,"name":"x"}]', offered)).toEqual([
			{ email: 'anna@example.org', name: 'Anna', present: true }
		]);
	});

	it('refuses people the page did not offer and bad values', () => {
		expect(parseTicks('[{"email":"eve@example.org","present":true}]', offered)).toBeNull();
		expect(parseTicks('[{"email":"anna@example.org","present":"ja"}]', offered)).toBeNull();
		expect(parseTicks('nope', offered)).toBeNull();
	});
});

describe('planAttendanceSave', () => {
	const { table } = buildAttendance(values);

	it('changes rows that differ, adds new people and drops doubled rows', () => {
		const plan = planAttendanceSave(table, 'p1', 'Probe 1', [
			{ email: 'anna@example.org', name: 'Anna', present: true },
			{ email: 'ben@example.org', name: 'Ben', present: false },
			{ email: 'cleo@example.org', name: 'Cleo', present: true }
		]);
		expect(plan.update).toEqual([{ row: 4, values: { present: true, name: 'Anna' } }]);
		expect(plan.append).toEqual([{ event: 'Probe 1', who: 'cleo@example.org', name: 'Cleo', present: true, eventId: 'p1' }]);
		expect(plan.remove).toEqual([2]);
	});

	it('has a version that changes with the ticks', () => {
		const changed = buildAttendance([...values.slice(0, 5), ['Probe 2', 'ben@example.org', 'Ben', '', 'p2']]).table;
		expect(attendanceVersion(changed, 'p1')).toBe(attendanceVersion(table, 'p1'));
		expect(attendanceVersion(changed, 'p2')).not.toBe(attendanceVersion(table, 'p2'));
	});
});

describe('attendanceSummary', () => {
	it('counts rehearsals attended, overall and per planned piece', () => {
		const attendance = buildAttendance(values);
		const planned = (id: string) => (id === 'p1' ? ['egmont'] : ['egmont', 'bolero']);
		const { taken, members } = attendanceSummary(attendance, ['p1', 'p2', 'p3'], ['anna@example.org', 'ben@example.org', 'cleo@example.org'], planned);
		expect(taken).toBe(2);
		expect(members[0]).toMatchObject({ present: 1, of: 2 });
		expect(members[0].pieces.get('egmont')).toEqual({ present: 1, of: 2 });
		expect(members[1].pieces.get('bolero')).toEqual({ present: 1, of: 1 });
		expect(members[2]).toMatchObject({ present: 0, of: 2 });
	});
});
