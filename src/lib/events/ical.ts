/**
 * iCalendar (RFC 5545) for the personal calendar feed (#122): just enough for phones and
 * desktop calendars to subscribe. Timed events in UTC, all-day events as dates.
 */

export interface FeedEvent {
	uid: string;
	title: string;
	/** ISO date-time, or "2026-11-15" for all-day events. */
	start: string;
	end: string;
	allDay: boolean;
	location?: string;
	description?: string;
	url?: string;
	/** Marked "(?)" in the calendar: not confirmed yet. */
	tentative?: boolean;
}

/** Commas, semicolons, backslashes and line breaks are escaped in text values. */
export function escapeText(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

const encoder = new TextEncoder();

/** Lines longer than 75 bytes continue on the next line after a space, never inside a character. */
export function foldLine(line: string): string {
	if (encoder.encode(line).length <= 75) return line;
	const parts: string[] = [];
	let current = '';
	let bytes = 0;
	for (const char of line) {
		const size = encoder.encode(char).length;
		// The first line may have 75 bytes, the following ones 74 after their leading space.
		if (bytes + size > (parts.length ? 74 : 75)) {
			parts.push(current);
			current = '';
			bytes = 0;
		}
		current += char;
		bytes += size;
	}
	parts.push(current);
	return parts.join('\r\n ');
}

/** "2026-11-15T16:00:00.000Z" → "20261115T160000Z"; "2026-11-15" → "20261115". */
export function icalDate(value: string, allDay: boolean): string {
	if (allDay) return value.slice(0, 10).replace(/-/g, '');
	return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildCalendar(name: string, events: FeedEvent[], now = new Date()): string {
	const stamp = icalDate(now.toISOString(), false);
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//sheetmanagement//Notenarchiv//DE',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeText(name)}`,
		// Calendar apps check again after this long (Google decides for itself).
		'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
		'X-PUBLISHED-TTL:PT6H'
	];
	for (const event of events) {
		const kind = event.allDay ? ';VALUE=DATE' : '';
		lines.push(
			'BEGIN:VEVENT',
			`UID:${escapeText(event.uid)}`,
			`DTSTAMP:${stamp}`,
			`DTSTART${kind}:${icalDate(event.start, event.allDay)}`,
			`DTEND${kind}:${icalDate(event.end, event.allDay)}`,
			`SUMMARY:${escapeText(event.title)}`,
			...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
			...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
			...(event.url ? [`URL:${event.url}`] : []),
			`STATUS:${event.tentative ? 'TENTATIVE' : 'CONFIRMED'}`,
			'END:VEVENT'
		);
	}
	lines.push('END:VCALENDAR');
	return lines.map(foldLine).join('\r\n') + '\r\n';
}
