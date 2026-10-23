import { describe, expect, it } from 'vitest';
import { isOrchestrasProgram, orchestraInitials, planShortcuts, programFor } from './current-program.ts';

describe('which programme folder belongs to a concert', () => {
	it('abbreviates orchestras the usual way', () => {
		expect(orchestraInitials('Ehemaligenorchester')).toBe('EO');
		expect(orchestraInitials('A-Orchester')).toBe('AO');
		expect(orchestraInitials('Junges Orchester')).toBe('JO');
	});

	it('matches the short name, the start or the initials', () => {
		expect(isOrchestrasProgram('Ehemaligenorchester', 'EO')).toBe(true);
		expect(isOrchestrasProgram('A-Orchester', 'A')).toBe(true);
		expect(isOrchestrasProgram('Kammerchor', 'kammerchor')).toBe(true);
		expect(isOrchestrasProgram('B-Orchester', 'A')).toBe(false);
		expect(isOrchestrasProgram('Ehemaligenorchester', '')).toBe(false);
	});

	it('never takes another orchestra’s programme', () => {
		expect(programFor(['Ehemaligenorchester', 'A-Orchester'], 'A')).toBe('A-Orchester');
		expect(programFor(['Ehemaligenorchester'], 'B')).toBeUndefined();
		expect(programFor(['Ehemaligenorchester', 'A-Orchester'], 'B')).toBeUndefined();
	});

	it('takes the only programme for a concert without an orchestra', () => {
		expect(programFor(['Ehemaligenorchester'], undefined)).toBe('Ehemaligenorchester');
		expect(programFor(['Ehemaligenorchester', 'A-Orchester'], undefined)).toBeUndefined();
	});
});

describe('planShortcuts', () => {
	const egmont = { folderId: 'egmont', name: 'Egmont' };
	const grieg = { folderId: 'grieg', name: 'Morgenstimmung' };

	it('adds what is missing and takes out what left the programme', () => {
		const plan = planShortcuts(
			[
				{ id: 's1', name: 'Egmont', targetId: 'egmont' },
				{ id: 's2', name: 'Bolero', targetId: 'bolero' },
				{ id: 'f1', name: 'Ablauf.pdf' }
			],
			[egmont, grieg]
		);
		expect(plan.create).toEqual([grieg]);
		expect(plan.trash.map((entry) => entry.id)).toEqual(['s2']);
		expect(plan.keep).toBe(1);
	});

	it('never touches files and folders, only shortcuts', () => {
		const plan = planShortcuts([{ id: 'real', name: 'Egmont (Kopie)' }], [egmont]);
		expect(plan.trash).toEqual([]);
		expect(plan.create).toEqual([egmont]);
	});

	it('links a piece once, even when it is twice in the programme or twice in the folder', () => {
		const plan = planShortcuts(
			[
				{ id: 's1', name: 'Egmont', targetId: 'egmont' },
				{ id: 's2', name: 'Egmont', targetId: 'egmont' }
			],
			[egmont, grieg, grieg]
		);
		expect(plan.trash.map((entry) => entry.id)).toEqual(['s2']);
		expect(plan.create).toEqual([grieg]);
	});
});
