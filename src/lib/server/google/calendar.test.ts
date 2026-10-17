import { describe, expect, it } from 'vitest';
import { toCalendarEvent } from './calendar.ts';

describe('toCalendarEvent', () => {
	it('maps all-day and timed events', () => {
		expect(
			toCalendarEvent({
				id: 'a',
				summary: ' Herbstkonzert ',
				location: 'Aula',
				start: { date: '2026-11-15' },
				end: { date: '2026-11-16' }
			})
		).toMatchObject({ title: 'Herbstkonzert', start: '2026-11-15', allDay: true, location: 'Aula' });

		expect(
			toCalendarEvent({
				id: 'b',
				summary: 'Probe',
				start: { dateTime: '2026-11-07T10:00:00+01:00' },
				end: { dateTime: '2026-11-07T13:00:00+01:00' }
			})
		).toMatchObject({ start: '2026-11-07T10:00:00+01:00', allDay: false, location: undefined });
	});

	it('drops cancelled events', () => {
		expect(toCalendarEvent({ id: 'c', status: 'cancelled', start: { date: '2026-01-01' } })).toBeNull();
	});
});
