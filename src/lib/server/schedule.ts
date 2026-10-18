import { config } from '#lib/config/index.ts';
import { dateParts, daysUntil, isPast } from '#lib/events/format.ts';
import { buildSchedule, type ScheduleEvent, type ShownEvent } from '#lib/events/schedule.ts';
import { cached } from './cache.ts';
import { appEnv, runInBackground } from './env.ts';
import { listEvents, type CalendarEvent } from './google/calendar.ts';
import { getGoogle, NotConfiguredError, requireSetting } from './services.ts';

const CALENDAR_MAX_AGE_MS = 10 * 60 * 1000;
const DAY_MS = 86_400_000;

export type ScheduleResult =
	| {
			ok: true;
			events: ShownEvent[];
			byId: Map<string, ShownEvent>;
			/** Link to subscribe to the calendar in Google Calendar. */
			subscribeUrl: string;
	  }
	| { ok: false; reason: 'not-configured' | 'failed' };

const built = new WeakMap<CalendarEvent[], ScheduleEvent[]>();

export async function getSchedule(now = Date.now()): Promise<ScheduleResult> {
	try {
		const calendarId = requireSetting('CALENDAR_ID');
		const { client } = getGoogle();
		const { value: raw } = await cached({
			key: `calendar:v1:${calendarId}`,
			maxAgeMs: CALENDAR_MAX_AGE_MS,
			// Three years back covers recent history; older concerts will come from the sheet.
			build: () =>
				listEvents(client, calendarId, {
					from: new Date(now - 3 * 365 * DAY_MS),
					to: new Date(now + 18 * 30 * DAY_MS)
				}),
			kv: appEnv().CACHE,
			waitUntil: runInBackground
		});

		let schedule = built.get(raw);
		if (!schedule) {
			schedule = buildSchedule(raw, config.events);
			built.set(raw, schedule);
		}

		const events = schedule.map((event) => ({
			...event,
			date: dateParts(event, config.locale, config.timeZone),
			daysUntil: daysUntil(event, now, config.timeZone),
			past: isPast(event, now)
		}));
		return {
			ok: true,
			events,
			byId: new Map(events.map((event) => [event.id, event])),
			subscribeUrl: `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`
		};
	} catch (error) {
		if (error instanceof NotConfiguredError) return { ok: false, reason: 'not-configured' };
		console.error('Loading the calendar failed:', error);
		return { ok: false, reason: 'failed' };
	}
}
