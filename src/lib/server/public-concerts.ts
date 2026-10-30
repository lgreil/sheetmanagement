import { getStore } from './db/index.ts';
import { isPastConcert, type Library, type LibraryConcert } from './library.ts';
import type { FeedEvent } from '#lib/events/ical.ts';

/**
 * Concerts for the orchestra's own website (#197). The app stays members-only; the website
 * reads this feed instead of someone typing dates and programmes in twice. Only concerts an
 * organiser published on their page are in it, upcoming ones and, for the Chronik, past ones.
 * Nothing about members: date, place, orchestras and what is played.
 */

export interface PublicConcert {
	id: string;
	title: string;
	/** "2026-12-13", "1957-12" or "1957": as exact as the date is known. */
	date: string;
	/** "Sonntag, 13. Dezember 2026", "Dezember 1957" … in the deployment's language. */
	dateText: string;
	/** From the calendar, for upcoming concerts and recent ones still in it. */
	start?: string;
	end?: string;
	allDay?: boolean;
	location?: string;
	orchestras: string[];
	program: { title: string; composer?: string; orchestra?: string }[];
}

export interface PublicFeed {
	upcoming: PublicConcert[];
	/** Newest first. */
	past: PublicConcert[];
}

/** Concert ids, kept with the app's own state, not in the sheet: publishing is the app's business. */
const KEY = 'public-concerts';

export async function publishedIds(): Promise<Set<string>> {
	const stored = await getStore()
		.getState(KEY)
		.catch(() => null);
	try {
		const ids = stored ? (JSON.parse(stored) as unknown) : [];
		return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
	} catch {
		return new Set();
	}
}

export async function setPublished(id: string, published: boolean): Promise<void> {
	const ids = await publishedIds();
	if (published) ids.add(id);
	else ids.delete(id);
	await getStore().setState(KEY, JSON.stringify([...ids].sort()));
}

function publicConcert(concert: LibraryConcert, library: Library): PublicConcert {
	const event = concert.event;
	return {
		id: concert.id,
		title: event?.displayTitle ?? concert.title,
		date: event ? event.start.slice(0, 10) : concert.dateKey,
		dateText: concert.label?.long ?? concert.dateText ?? '',
		...(event ? { start: event.start, end: event.end, allDay: event.allDay } : {}),
		location: event?.location || concert.location || undefined,
		orchestras: concert.orchestras,
		program: concert.program.map((item) => {
			const composer = item.pieceId ? library.piecesById.get(item.pieceId)?.composer : undefined;
			return { title: item.title, ...(composer ? { composer } : {}), ...(item.orchestra ? { orchestra: item.orchestra } : {}) };
		})
	};
}

/** The published concerts, upcoming soonest first and past newest first. */
export function publicFeed(library: Library, published: Set<string>): PublicFeed {
	const concerts = [...published].map((id) => library.concertsById.get(id)).filter((concert) => !!concert);
	const upcoming = concerts.filter((concert) => !isPastConcert(concert, library.today));
	const past = concerts.filter((concert) => isPastConcert(concert, library.today));
	const byDate = (a: PublicConcert, b: PublicConcert) => (a.start ?? a.date).localeCompare(b.start ?? b.date);
	return {
		upcoming: upcoming.map((concert) => publicConcert(concert, library)).sort(byDate),
		past: past.map((concert) => publicConcert(concert, library)).sort((a, b) => byDate(b, a))
	};
}

/** The upcoming ones for calendar apps; past concerts without a time from the calendar can't be events. */
export function feedEventsOf(feed: PublicFeed, programLabel: string): FeedEvent[] {
	return feed.upcoming
		.filter((concert) => concert.start && concert.end)
		.map((concert) => ({
			uid: `${concert.id}@sheetmanagement-public`,
			title: concert.title,
			start: concert.start!,
			end: concert.end!,
			allDay: !!concert.allDay,
			location: concert.location,
			description: concert.program.length
				? `${programLabel}\n${concert.program.map((item) => (item.composer ? `${item.composer}: ${item.title}` : item.title)).join('\n')}`
				: undefined
		}));
}
