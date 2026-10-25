import { dateFormat } from '#lib/events/format.ts';

/**
 * Dates in the sheet may be imprecise: old concerts are often known only by year or
 * month. "1957", "1957-12", "1957-12-21", "12.1957" and "21.12.1957" are all valid.
 */
export interface FuzzyDate {
	year: number;
	month?: number;
	day?: number;
}

export function parseFuzzyDate(text: string): FuzzyDate | null {
	const value = text.trim();
	let match: RegExpMatchArray | null;
	let date: FuzzyDate | null = null;
	if ((match = value.match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/))) {
		date = { year: +match[1], month: match[2] ? +match[2] : undefined, day: match[3] ? +match[3] : undefined };
	} else if ((match = value.match(/^(?:(\d{1,2})\.\s*)?(\d{1,2})\.\s*(\d{4})$/))) {
		date = { year: +match[3], month: +match[2], day: match[1] ? +match[1] : undefined };
	}
	if (!date) return null;
	if (date.month !== undefined && (date.month < 1 || date.month > 12)) return null;
	if (date.day !== undefined) {
		const check = new Date(Date.UTC(date.year, date.month! - 1, date.day));
		if (check.getUTCDate() !== date.day) return null;
	}
	return Object.fromEntries(Object.entries(date).filter(([, v]) => v !== undefined)) as unknown as FuzzyDate;
}

/** "1957-12-21", "1957-12" or "1957": sorts correctly as text. */
export function fuzzyDateKey(date: FuzzyDate): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return [String(date.year), date.month && pad(date.month), date.day && date.month && pad(date.day)]
		.filter(Boolean)
		.join('-');
}

export interface FuzzyDateLabel {
	/** "Samstag, 21. Dezember 1957", "Dezember 1957" or "1957" */
	long: string;
	/** "21", or empty without a day */
	day: string;
	/** "Dez.", or empty without a month */
	month: string;
	year: string;
}

export function formatFuzzyDate(date: FuzzyDate, locale: string): FuzzyDateLabel {
	const utc = new Date(Date.UTC(date.year, (date.month ?? 1) - 1, date.day ?? 1));
	const format = (options: Intl.DateTimeFormatOptions) =>
		dateFormat(locale, { timeZone: 'UTC', ...options }).format(utc);
	const year = String(date.year);
	if (!date.month) return { long: year, day: '', month: '', year };
	if (!date.day) return { long: format({ month: 'long', year: 'numeric' }), day: '', month: format({ month: 'short' }), year };
	return {
		long: format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
		day: format({ day: 'numeric' }),
		month: format({ month: 'short' }),
		year
	};
}

/**
 * A short date for narrow lists (#223): "19. Nov." for a day of this year, "19. Nov. 2027" for
 * another; "Nov. 2027" or "2027" when the key ("2026-11-19", see fuzzyDateKey) has no day.
 */
export function shortDateLabel(key: string, today: string, locale: string): string {
	const [year, month, day] = key.split('-').map(Number);
	if (!year) return '';
	if (!month) return String(year);
	const otherYear = year !== Number(today.slice(0, 4));
	const options: Intl.DateTimeFormatOptions = day ? { day: 'numeric', month: 'short' } : { month: 'short', year: 'numeric' };
	return dateFormat(locale, { timeZone: 'UTC', ...options, ...(otherYear ? { year: 'numeric' } : {}) }).format(new Date(Date.UTC(year, month - 1, day || 1)));
}

/** The calendar day of an event in the given time zone, as "2026-11-15". */
export function eventDay(event: { start: string; allDay: boolean }, timeZone: string): string {
	if (event.allDay) return event.start.slice(0, 10);
	return dateFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(event.start));
}
