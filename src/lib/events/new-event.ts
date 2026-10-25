import type { EventKeywords } from '#lib/config/index.ts';
import type { CalendarEvent } from '#lib/server/google/calendar.ts';
import { joinList } from '#lib/repertoire/lists.ts';
import { orchestraChoices, rowOrchestra, sameOrchestra, titleOrchestra } from '#lib/repertoire/orchestras.ts';
import { buildSchedule, classify, significantWords } from './schedule.ts';

/**
 * A concert or rehearsal entered on /kalender, as Google Calendar's events.insert expects it.
 * The app knows an event's type and its concert only from the title (see schedule.ts), so the
 * title is made to say both: "Probe Herbstkonzert" prepares for the Herbstkonzert. A rehearsal
 * of only some of the orchestras names them too, "Probe Herbstkonzert (A)", so everyone looking
 * at the calendar sees it; all of them together, the usual case, needs no name.
 */

export const NEW_EVENT_TYPES = ['konzert', 'probe', 'generalprobe'] as const;
export type NewEventType = (typeof NEW_EVENT_TYPES)[number];

export type NewEventProblem = 'type' | 'title' | 'date' | 'too-early' | 'too-late' | 'time' | 'end' | 'concert' | 'orchestra' | 'too-long';

/** The request body for events.insert: all-day with dates, otherwise local times in the orchestra's zone. */
export interface NewEventBody {
	summary: string;
	location?: string;
	description?: string;
	start: { date: string } | { dateTime: string; timeZone: string };
	end: { date: string } | { dateTime: string; timeZone: string };
}

export interface NewEventContext {
	keywords: EventKeywords;
	timeZone: string;
	/** Concerts a rehearsal may prepare for: the upcoming ones from the calendar. */
	concerts: Pick<CalendarEvent, 'id' | 'title' | 'start' | 'end' | 'allDay'>[];
	/** The orchestras sharing the calendar (config.orchestras). */
	orchestras?: string[];
	/** The first and last day the app loads from the calendar: a date outside would never show. */
	range?: { first: string; last: string };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Without an end time: a concert takes about two hours, a rehearsal three. */
const DEFAULT_HOURS: Record<NewEventType, number> = { konzert: 2, probe: 3, generalprobe: 3 };

const text = (form: FormData, name: string) => String(form.get(name) ?? '').trim().replace(/\s+/g, ' ');
const nextDay = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const clock = (total: number) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/** The title as the calendar keeps it: with a word that gives the type, and the concert's name for a rehearsal. */
export function newEventTitle(
	type: NewEventType,
	title: string,
	date: string,
	{ keywords, concerts, orchestras = [] }: Pick<NewEventContext, 'keywords' | 'concerts' | 'orchestras'>,
	concert?: NewEventContext['concerts'][number],
	orchestra?: string
): string {
	// "Generalprobe" for a Generalprobe, "Probe" rather than "Stimmprobe" for a rehearsal.
	const word = keywords[type][0] ?? type;
	const typeWord = word.charAt(0).toUpperCase() + word.slice(1);
	let result = title || typeWord;
	if (classify(result, keywords) !== type) result = `${typeWord} ${result}`;
	if (concert && type !== 'konzert') {
		// The title names the concert and the schedule links it there, among all concerts;
		// otherwise the concert's name is added. Everyone reading the calendar sees what it's for.
		const words = significantWords(concert.title, keywords);
		const named = [...significantWords(result, keywords)].some((word) => words.has(word));
		const linked =
			buildSchedule([{ id: '', title: result, start: date, end: date, allDay: true }, ...concerts], keywords).find((event) => event.id === '')?.concertId ===
			concert.id;
		if (!named || !linked) result = `${result} ${concert.title.replace(/\(\s*\?\s*\)/, '').replace(/\s+/g, ' ').trim()}`;
	}
	// Some of the orchestras, unless the title already names just them.
	const some = orchestra && type !== 'konzert' && !sameOrchestra(orchestra, joinList(orchestras));
	if (some && !sameOrchestra(titleOrchestra(result, orchestras), orchestra)) result = `${result} (${orchestra})`;
	return result;
}

/** The form on /kalender → the event to insert, or what's wrong with it. */
export function newEventFromForm(form: FormData, context: NewEventContext): { event: NewEventBody } | { error: NewEventProblem } {
	const type = text(form, 'type') as NewEventType;
	if (!NEW_EVENT_TYPES.includes(type)) return { error: 'type' };
	const title = text(form, 'title');
	const date = text(form, 'date');
	const start = text(form, 'start');
	const end = text(form, 'end');
	const location = text(form, 'location');
	const description = String(form.get('description') ?? '').trim();
	const concertId = text(form, 'concert');
	const orchestras = context.orchestras ?? [];
	// Empty is all of them together.
	const orchestra = type === 'konzert' ? undefined : rowOrchestra(text(form, 'orchestra'), orchestras);

	if (type === 'konzert' && !title) return { error: 'title' };
	if (title.length > 120 || location.length > 200 || description.length > 2000) return { error: 'too-long' };
	if (!DATE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return { error: 'date' };
	if (context.range && date < context.range.first) return { error: 'too-early' };
	if (context.range && date > context.range.last) return { error: 'too-late' };
	if ((start && !TIME.test(start)) || (end && !TIME.test(end)) || (end && !start)) return { error: 'time' };
	if (start && end && minutes(end) <= minutes(start)) return { error: 'end' };

	const concert = concertId ? context.concerts.find((candidate) => candidate.id === concertId) : undefined;
	if (concertId && (!concert || type === 'konzert')) return { error: 'concert' };
	if (orchestra && ![...orchestraChoices(orchestras), joinList(orchestras)].some((choice) => sameOrchestra(choice, orchestra))) return { error: 'orchestra' };

	const summary = newEventTitle(type, title, date, context, concert, orchestra) + (form.get('tentative') ? ' (?)' : '');
	const until = end || clock(Math.min(minutes(start) + DEFAULT_HOURS[type] * 60, 23 * 60 + 59));
	return {
		event: {
			summary,
			...(location ? { location } : {}),
			...(description ? { description } : {}),
			start: start ? { dateTime: `${date}T${start}:00`, timeZone: context.timeZone } : { date },
			end: start ? { dateTime: `${date}T${until}:00`, timeZone: context.timeZone } : { date: nextDay(date) }
		}
	};
}
