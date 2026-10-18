import { concertSummary, getLibrary, isPastConcert } from '#lib/server/library.ts';
import { config } from '#lib/config/index.ts';
import { addConcert } from '#lib/server/archive.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const library = await getLibrary();
	const archive = { canAdd: locals.access.rights.has('archiv.bearbeiten') && library.sheet === 'ok', orchestras: config.orchestras };
	const schedule = library.schedule;

	// Past concerts: the calendar's recent ones and the history from the sheet, newest first.
	const past = library.concerts.filter((concert) => isPastConcert(concert, library.today)).map(concertSummary);

	if (!schedule.ok) {
		return { error: schedule.reason, upcoming: [], past, concertTitles: {}, subscribeUrl: null, archive };
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
		subscribeUrl: schedule.subscribeUrl,
		archive
	};
};

export const actions: Actions = {
	addConcert: ({ locals, request }) => addConcert(locals, request)
};
