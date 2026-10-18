import { concertSummary, getLibrary, isPastConcert } from '#lib/server/library.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const library = await getLibrary();
	const schedule = library.schedule;

	// Past concerts: the calendar's recent ones and the history from the sheet, newest first.
	const past = library.concerts.filter((concert) => isPastConcert(concert, library.today)).map(concertSummary);

	if (!schedule.ok) {
		return { error: schedule.reason, upcoming: [], past, concertTitles: {}, subscribeUrl: null };
	}

	const concertTitles: Record<string, string> = {};
	for (const event of schedule.events) {
		if (event.type === 'konzert') concertTitles[event.id] = event.displayTitle;
	}

	return {
		error: null,
		upcoming: schedule.events.filter((event) => !event.past),
		past,
		concertTitles,
		subscribeUrl: schedule.subscribeUrl
	};
};
