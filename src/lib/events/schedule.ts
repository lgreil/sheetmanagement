import type { EventKeywords } from '#lib/config/index.ts';
import type { CalendarEvent } from '#lib/server/google/calendar.ts';
import { searchText } from '#lib/music/text.ts';
import type { DateParts } from './format.ts';

export type EventType = 'konzert' | 'generalprobe' | 'probe' | 'sonstiges';

export interface ScheduleEvent extends CalendarEvent {
	type: EventType;
	/** Title without the "(?)" marker. */
	displayTitle: string;
	/** Marked with "(?)" in the calendar: not confirmed yet. */
	tentative: boolean;
	/** For rehearsals: the concert they prepare for. */
	concertId?: string;
	/** For concerts: their rehearsals, in date order. */
	rehearsalIds: string[];
}

/** An event with everything the pages show, formatted on the server. */
export interface ShownEvent extends ScheduleEvent {
	date: DateParts;
	daysUntil: number;
	past: boolean;
}

const TENTATIVE = /\(\s*\?\s*\)/;

/** The first matching keyword group wins, in the order Generalprobe → Probe → Konzert. */
export function classify(title: string, keywords: EventKeywords): EventType {
	const text = searchText(title);
	const has = (words: string[]) => words.some((word) => text.includes(searchText(word)));
	if (has(keywords.generalprobe)) return 'generalprobe';
	if (has(keywords.probe)) return 'probe';
	if (has(keywords.konzert)) return 'konzert';
	return 'sonstiges';
}

/** Distinctive words of a title, e.g. "Probe Herbstkonzert 🎶🍂" → ["herbstkonzert"]. */
export function significantWords(title: string, keywords: EventKeywords): Set<string> {
	const ignore = new Set(
		[...keywords.generalprobe, ...keywords.probe, ...keywords.konzert].map((word) => searchText(word))
	);
	return new Set(
		searchText(title)
			.replace(/[^a-z0-9]+/g, ' ')
			.split(' ')
			.filter((word) => word.length > 2 && !ignore.has(word) && !/^\d+$/.test(word))
	);
}

const startTime = (event: CalendarEvent) => new Date(event.start).getTime();

/** If no title matches, a rehearsal belongs to the next concert within this many days. */
const FALLBACK_DAYS = 90;

/**
 * Classifies events and links rehearsals to concerts: a rehearsal belongs to the first
 * later concert sharing a word with it ("Probe Herbstkonzert" → "Herbstkonzert"),
 * otherwise to the next concert within a few months.
 */
export function buildSchedule(events: CalendarEvent[], keywords: EventKeywords): ScheduleEvent[] {
	const schedule: ScheduleEvent[] = events
		.map((event) => ({
			...event,
			type: classify(event.title, keywords),
			displayTitle: event.title.replace(TENTATIVE, '').replace(/\s+/g, ' ').trim(),
			tentative: TENTATIVE.test(event.title),
			rehearsalIds: [] as string[]
		}))
		.sort((a, b) => startTime(a) - startTime(b));

	const concerts = schedule.filter((event) => event.type === 'konzert');
	for (const rehearsal of schedule) {
		if (rehearsal.type !== 'probe' && rehearsal.type !== 'generalprobe') continue;
		const later = concerts.filter((concert) => startTime(concert) >= startTime(rehearsal));
		const words = significantWords(rehearsal.title, keywords);
		const byTitle = later.find((concert) =>
			[...significantWords(concert.title, keywords)].some((word) => words.has(word))
		);
		const next = later[0];
		const nearby = next && startTime(next) - startTime(rehearsal) <= FALLBACK_DAYS * 86_400_000 ? next : undefined;
		const concert = byTitle ?? nearby;
		if (concert) {
			rehearsal.concertId = concert.id;
			concert.rehearsalIds.push(rehearsal.id);
		}
	}
	return schedule;
}
