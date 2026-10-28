/**
 * Date polls for the orga team (#95): a title, a few dates to choose from, and per person
 * yes, maybe or no for each. Only the groups a poll is meant for see it. The answers are kept
 * by the app itself (D1), not in the sheet: nobody edits them by hand, and many answer at once.
 */

import { dateFormat } from '#lib/events/format.ts';

export const ANSWERS = ['yes', 'maybe', 'no'] as const;
export type PollAnswer = (typeof ANSWERS)[number];

export interface PollOption {
	id: string;
	/** "2026-11-03" */
	date: string;
	/** The last day when the option spans several, e.g. a rehearsal weekend Fr–Sa: "2026-11-04". */
	until?: string;
	/** "19:00", empty for a whole day. */
	start?: string;
	/** "21:30" */
	end?: string;
}

export interface Poll {
	id: string;
	title: string;
	note?: string;
	options: PollOption[];
	/** Groups from "Mitglieder" who see and answer it, e.g. ["Orga", "Dirigat"]. */
	groups: string[];
	/** "2026-11-01": answers are welcome until the end of this day. */
	deadline?: string;
	createdBy: string;
	createdByName: string;
	createdAt: string;
	closedAt?: string;
	/** The options picked when it was closed (#209): one date, several (a weekend), or none. */
	chosen: string[];
}

export interface PollResponse {
	email: string;
	name: string;
	choices: Record<string, PollAnswer>;
	comment?: string;
	updatedAt: string;
}

/** Who may see a poll: its groups, whoever made it, and those who plan dates. */
export function canSeePoll(poll: Poll, viewer: { email: string; groups: string[]; plans: boolean }): boolean {
	if (viewer.plans || poll.createdBy === viewer.email) return true;
	const mine = new Set(viewer.groups.map((group) => group.trim().toLowerCase()));
	return poll.groups.some((group) => mine.has(group.trim().toLowerCase()));
}

export const isOpen = (poll: Poll, today: string) => !poll.closedAt && (!poll.deadline || poll.deadline >= today);

export interface OptionScore {
	option: PollOption;
	yes: number;
	maybe: number;
	no: number;
}

/** Per option how many said yes, maybe and no; best first: most yes, then most maybe, then earliest. */
export function scoreOptions(poll: Poll, responses: PollResponse[]): OptionScore[] {
	return poll.options
		.map((option) => {
			const count = (answer: PollAnswer) => responses.filter((response) => response.choices[option.id] === answer).length;
			return { option, yes: count('yes'), maybe: count('maybe'), no: count('no') };
		})
		.sort(
			(a, b) =>
				b.yes - a.yes ||
				b.maybe - a.maybe ||
				`${a.option.date}${a.option.start ?? ''}`.localeCompare(`${b.option.date}${b.option.start ?? ''}`)
		);
}

/** The best option, when anyone has answered yes or maybe. */
export function bestOption(poll: Poll, responses: PollResponse[]): PollOption | undefined {
	const [best] = scoreOptions(poll, responses);
	return best && best.yes + best.maybe > 0 ? best.option : undefined;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export type NewPoll = Pick<Poll, 'title' | 'note' | 'options' | 'groups' | 'deadline'>;

/**
 * A poll from the form: "title", "note", "deadline", "groups" (repeated), and per option
 * "date", "until", "start" and "end" (repeated in the same order). Empty option rows are skipped.
 */
export function pollFromForm(data: FormData): { poll: NewPoll } | { error: 'title' | 'options' | 'groups' | 'time' } {
	const text = (name: string, max: number) => String(data.get(name) ?? '').trim().slice(0, max);
	const title = text('title', 120);
	if (!title) return { error: 'title' };
	const dates = data.getAll('date').map(String);
	const untils = data.getAll('until').map(String);
	const starts = data.getAll('start').map(String);
	const ends = data.getAll('end').map(String);
	const options: PollOption[] = [];
	for (const [i, date] of dates.entries()) {
		if (!date.trim()) continue;
		const start = starts[i]?.trim() || undefined;
		const end = ends[i]?.trim() || undefined;
		// A last day on or before the first one means a single day.
		const until = untils[i]?.trim() || undefined;
		if (!DAY.test(date) || (until && !DAY.test(until)) || (start && !TIME.test(start)) || (end && (!TIME.test(end) || !start || end <= start))) return { error: 'time' };
		options.push({ id: `o${options.length + 1}`, date, ...(until && until > date ? { until } : {}), start, end });
	}
	if (options.length < 2 || options.length > 30) return { error: 'options' };
	const groups = [...new Set(data.getAll('groups').map((group) => String(group).trim()).filter(Boolean))].slice(0, 10);
	if (!groups.length) return { error: 'groups' };
	const deadline = text('deadline', 10);
	return {
		poll: {
			title,
			note: text('note', 1000) || undefined,
			options: options.sort((a, b) => `${a.date}${a.start ?? ''}`.localeCompare(`${b.date}${b.start ?? ''}`)),
			groups,
			deadline: DAY.test(deadline) ? deadline : undefined
		}
	};
}

/** One person's answers from the form: "choice:<option id>" = yes, maybe or no; "comment". */
export function choicesFromForm(poll: Poll, data: FormData): { choices: Record<string, PollAnswer>; comment?: string } {
	const choices: Record<string, PollAnswer> = {};
	for (const option of poll.options) {
		const value = String(data.get(`choice:${option.id}`) ?? '');
		if ((ANSWERS as readonly string[]).includes(value)) choices[option.id] = value as PollAnswer;
	}
	const comment = String(data.get('comment') ?? '').trim().slice(0, 300);
	return { choices, comment: comment || undefined };
}

/**
 * A link that opens Google Calendar with the event filled in, for whoever keeps the calendar
 * to save: the app itself doesn't write to the calendar.
 */
export function calendarLink(title: string, option: PollOption, timeZone: string, details?: string): string {
	const day = option.date.replace(/-/g, '');
	const last = (option.until ?? option.date).replace(/-/g, '');
	let dates: string;
	if (option.start) {
		// Without an end, two hours: about a rehearsal. Over several days, from the first day's start to the last day's end.
		const [h, m] = option.start.split(':').map(Number);
		const end = option.end ?? `${String(Math.min(h + 2, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
		dates = `${day}T${option.start.replace(':', '')}00/${last}T${end.replace(':', '')}00`;
	} else {
		const next = new Date(`${option.until ?? option.date}T00:00:00Z`);
		next.setUTCDate(next.getUTCDate() + 1);
		dates = `${day}/${next.toISOString().slice(0, 10).replace(/-/g, '')}`;
	}
	const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates, ctz: timeZone });
	if (details) params.set('details', details);
	return `https://calendar.google.com/calendar/render?${params}`;
}

/**
 * How an option reads: "Sa", "6", "März", "10:00–17:00", a short "Sa 6. März" for narrow
 * columns, and all of it in one line. Over several days (#209): "Fr–Sa", "6–7", "Fr 6. – Sa 7. März".
 */
export function optionLabel(option: Pick<PollOption, 'date' | 'until' | 'start' | 'end'>, locale: string) {
	const first = new Date(`${option.date}T12:00:00Z`);
	const last = new Date(`${option.until ?? option.date}T12:00:00Z`);
	const format = (options: Intl.DateTimeFormatOptions) => dateFormat(locale, { timeZone: 'UTC', ...options });
	// One date, or the range the way the locale writes it ("18.–19. Dez.", "31. Dez. – 1. Jan.").
	const span = (options: Intl.DateTimeFormatOptions) => (option.until ? format(options).formatRange(first, last) : format(options).format(first));
	const weekday = (date: Date) => format({ weekday: 'short' }).format(date).replace('.', '');
	const day = (date: Date) => format({ day: 'numeric' }).format(date);
	const time = option.start ? (option.end ? `${option.start}–${option.end}` : option.start) : '';
	const long = span({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	return {
		weekday: option.until ? `${weekday(first)}–${weekday(last)}` : weekday(first),
		day: option.until ? `${day(first)}–${day(last)}` : day(first),
		month: span({ month: 'short' }).replace(/\./g, ''),
		time,
		short: span({ weekday: 'short', day: 'numeric', month: 'short' }),
		long: time ? `${long}, ${time}` : long
	};
}

export interface PollDate {
	poll: Pick<Poll, 'id' | 'title'>;
	/** "2026-11-03", one per day even when a poll offers two times that day. */
	days: string[];
}

/**
 * Where open polls' dates fall, for the calendar (#95): per month ("2026-11") the polls with
 * their proposed days from today on, in date order. A month with no event still gets them.
 */
export function pollDatesByMonth(polls: Pick<Poll, 'id' | 'title' | 'options'>[], today: string): Map<string, PollDate[]> {
	const months = new Map<string, PollDate[]>();
	for (const poll of polls) {
		const days = [...new Set(poll.options.flatMap(daysOf).filter((date) => date >= today))].sort();
		for (const day of days) {
			const month = months.get(day.slice(0, 7)) ?? [];
			const entry = month.find((item) => item.poll.id === poll.id) ?? month[month.push({ poll: { id: poll.id, title: poll.title }, days: [] }) - 1];
			entry.days.push(day);
			months.set(day.slice(0, 7), month);
		}
	}
	return new Map([...months].sort(([a], [b]) => a.localeCompare(b)));
}

/** Every day an option covers, from its first to its last ("2026-11-03", "2026-11-04"). */
export function daysOf(option: Pick<PollOption, 'date' | 'until'>): string[] {
	const days = [option.date];
	const day = new Date(`${option.date}T00:00:00Z`);
	// At most a fortnight: an option is a weekend or a short tour, not a season.
	while (option.until && days.length < 15) {
		day.setUTCDate(day.getUTCDate() + 1);
		const next = day.toISOString().slice(0, 10);
		if (next > option.until) break;
		days.push(next);
	}
	return days;
}
