/**
 * Date formatting that gives the same text on the server and in the browser:
 * always in the orchestra's time zone, never the visitor's.
 */

export interface DateParts {
	/** "15" */
	day: string;
	/** "Nov." */
	month: string;
	/** "So." */
	weekday: string;
	/** "Sonntag, 15. November 2026" */
	long: string;
	/** "10:00 – 13:00", empty for all-day events */
	time: string;
	/** "2026-11" for grouping by month */
	monthKey: string;
	/** "November 2026" */
	monthLabel: string;
}

const formats = new Map<string, Intl.DateTimeFormat>();

/**
 * One shared formatter per locale and options. Creating an Intl.DateTimeFormat costs
 * far more than using one, and pages format hundreds of dates per request.
 */
export function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
	const key = `${locale}|${JSON.stringify(options)}`;
	let format = formats.get(key);
	if (!format) {
		format = new Intl.DateTimeFormat(locale, options);
		formats.set(key, format);
	}
	return format;
}

export function dateParts(
	event: { start: string; end: string; allDay: boolean },
	locale: string,
	timeZone: string
): DateParts {
	// All-day dates ("2026-11-15") have no time zone; read them as UTC so they don't shift.
	const zone = event.allDay ? 'UTC' : timeZone;
	const start = new Date(event.start);
	const format = (options: Intl.DateTimeFormatOptions) =>
		dateFormat(locale, { timeZone: zone, ...options }).format(start);
	const time = (date: Date) => dateFormat(locale, { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(date);

	const year = format({ year: 'numeric' });
	const monthNumber = format({ month: '2-digit' });
	return {
		day: format({ day: 'numeric' }),
		month: format({ month: 'short' }),
		weekday: format({ weekday: 'short' }),
		long: format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
		time: event.allDay ? '' : `${time(start)} – ${time(new Date(event.end))}`,
		monthKey: `${year}-${monthNumber}`,
		monthLabel: format({ month: 'long', year: 'numeric' })
	};
}

/** Whole days from `now` to the event's day, in the orchestra's time zone. 0 = today. */
export function daysUntil(event: { start: string; allDay: boolean }, now: number, timeZone: string): number {
	const dayOf = (date: Date, zone: string) =>
		dateFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
	const eventDay = event.allDay ? event.start.slice(0, 10) : dayOf(new Date(event.start), timeZone);
	const today = dayOf(new Date(now), timeZone);
	return Math.round((Date.parse(eventDay) - Date.parse(today)) / 86_400_000);
}

/** The event has ended (all-day events end with their day). */
export function isPast(event: { end: string; allDay: boolean }, now: number): boolean {
	return new Date(event.end).getTime() <= now;
}

/** "2027-03-31" → "31. März 2027". The day is a calendar day, so no time zone applies. */
export function formatDay(day: string, locale: string): string {
	return dateFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
}
