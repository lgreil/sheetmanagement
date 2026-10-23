import { config } from '#lib/config/index.ts';
import { dateParts, daysUntil, isPast, type DateParts } from '#lib/events/format.ts';
import { buildSchedule, type ScheduleEvent, type ShownEvent } from '#lib/events/schedule.ts';
import { cached } from './cache.ts';
import { appEnv, runInBackground } from './env.ts';
import { insertEvent, listEvents, type CalendarEvent } from './google/calendar.ts';
import { calendarWriteEnabled, getGoogle, NotConfiguredError, requireSetting } from './services.ts';
import type { NewEventBody } from '#lib/events/new-event.ts';

const CALENDAR_MAX_AGE_MS = 10 * 60 * 1000;
const DAY_MS = 86_400_000;

export type ScheduleResult =
	| {
			ok: true;
			events: ShownEvent[];
			byId: Map<string, ShownEvent>;
			/** Link to subscribe to the calendar in Google Calendar. */
			subscribeUrl: string;
			/** The calendar snapshot these events come from, for caching what's built from them. */
			snapshot: object;
	  }
	| { ok: false; reason: 'not-configured' | 'failed' };

/**
 * The dates the app loads from the calendar: three years back covers recent history (older
 * concerts come from the sheet), a year and a half ahead the planning. Dates outside never show.
 */
export function calendarRange(now: number) {
	return { from: new Date(now - 3 * 365 * DAY_MS), to: new Date(now + 18 * 30 * DAY_MS) };
}

const built = new WeakMap<CalendarEvent[], (ScheduleEvent & { date: DateParts })[]>();

/** The calendar's events, cached; forced after the app added one, so it shows at once. */
function calendarEvents(now: number, force = false) {
	const calendarId = requireSetting('CALENDAR_ID');
	const { client } = getGoogle();
	return cached({
		key: `calendar:v1:${calendarId}`,
		maxAgeMs: CALENDAR_MAX_AGE_MS,
		build: () => listEvents(client, calendarId, calendarRange(now)),
		kv: appEnv().CACHE,
		waitUntil: runInBackground,
		force
	});
}

export async function getSchedule(now = Date.now()): Promise<ScheduleResult> {
	try {
		const calendarId = requireSetting('CALENDAR_ID');
		const { value: raw } = await calendarEvents(now);

		// Building and formatting happen once per calendar snapshot; only what depends on
		// the current time is computed per request.
		let schedule = built.get(raw);
		if (!schedule) {
			schedule = buildSchedule(raw, config.events).map((event) => ({
				...event,
				date: dateParts(event, config.locale, config.timeZone)
			}));
			built.set(raw, schedule);
		}

		const events = schedule.map((event) => ({
			...event,
			daysUntil: daysUntil(event, now, config.timeZone),
			past: isPast(event, now)
		}));
		return {
			ok: true,
			events,
			byId: new Map(events.map((event) => [event.id, event])),
			subscribeUrl: `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`,
			snapshot: schedule
		};
	} catch (error) {
		if (error instanceof NotConfiguredError) return { ok: false, reason: 'not-configured' };
		console.error('Loading the calendar failed:', error);
		return { ok: false, reason: 'failed' };
	}
}

export type AddEventResult = { ok: true; event: CalendarEvent } | { ok: false; reason: 'not-configured' | 'read-only' | 'refused' | 'failed' };

/**
 * Adds a concert or rehearsal to the calendar (CALENDAR_WRITE), then reloads the calendar so
 * the new date is on every page right away. The caller checks the right ("termine.planen").
 */
export async function addCalendarEvent(event: NewEventBody, now = Date.now()): Promise<AddEventResult> {
	let calendarId: string;
	try {
		calendarId = requireSetting('CALENDAR_ID');
		if (!calendarWriteEnabled()) return { ok: false, reason: 'read-only' };
		const created = await insertEvent(getGoogle().client, calendarId, event);
		await calendarEvents(now, true).catch((error) => console.error('Reloading the calendar after adding an event failed:', error));
		return { ok: true, event: created };
	} catch (error) {
		if (error instanceof NotConfiguredError) return { ok: false, reason: 'not-configured' };
		// 403/404: the calendar isn't shared with the service account for changes.
		const status = (error as { status?: number }).status;
		console.error('Adding an event to the calendar failed:', error);
		return { ok: false, reason: status === 403 || status === 404 ? 'refused' : 'failed' };
	}
}
