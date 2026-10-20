import { describe, expect, it } from 'vitest';
import { addMonths, eventDayKey, monthGrid } from './calendar.ts';

describe('monthGrid', () => {
	it('fills whole weeks from Monday to Sunday', () => {
		// November 2026 starts on a Sunday and ends on a Monday.
		const weeks = monthGrid('2026-11');
		expect(weeks).toHaveLength(6);
		expect(weeks[0][0]).toEqual({ key: '2026-10-26', day: 26, inMonth: false });
		expect(weeks[0][6]).toEqual({ key: '2026-11-01', day: 1, inMonth: true });
		expect(weeks[5][0]).toEqual({ key: '2026-11-30', day: 30, inMonth: true });
		expect(weeks[5][6].key).toBe('2026-12-06');
	});

	it('needs only four weeks for a February starting on Monday', () => {
		const weeks = monthGrid('2027-02');
		expect(weeks).toHaveLength(4);
		expect(weeks[0][0].key).toBe('2027-02-01');
		expect(weeks.flat().every((day) => day.inMonth)).toBe(true);
	});
});

describe('addMonths', () => {
	it('steps across years', () => {
		expect(addMonths('2026-12', 1)).toBe('2027-01');
		expect(addMonths('2026-01', -1)).toBe('2025-12');
	});
});

it('builds an event day key', () => {
	expect(eventDayKey({ monthKey: '2026-11', day: '5' })).toBe('2026-11-05');
});
