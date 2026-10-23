import { fail } from '@sveltejs/kit';
import { concertSummary, getLibrary, isPastConcert } from '#lib/server/library.ts';
import { config } from '#lib/config/index.ts';
import { newEventFromForm } from '#lib/events/new-event.ts';
import { t } from '#lib/i18n/index.ts';
import { isOpen } from '#lib/polls/polls.ts';
import { addConcert } from '#lib/server/archive.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { pollStore, pollViewer, visiblePolls } from '#lib/server/polls.ts';
import { addCalendarEvent, getSchedule } from '#lib/server/schedule.ts';
import { calendarWriteEnabled } from '#lib/server/services.ts';
import type { Actions, PageServerLoad } from './$types';

/** List or calendar, remembered per viewer in a cookie the page sets. */
const VIEW_COOKIE = 'konzerte-ansicht';

/** Open date polls meant for you (#95), with whether you've answered: they sit next to the dates. */
async function openPolls(locals: App.Locals, today: string) {
	const store = pollStore();
	const viewer = await pollViewer(locals);
	if (!store || !viewer) return { polls: [], plans: false };
	const polls = await Promise.all(
		(await visiblePolls(locals))
			.filter((poll) => isOpen(poll, today))
			.map(async (poll) => {
				const responses = (await store.get(poll.id))?.responses ?? [];
				return { ...poll, answers: responses.length, answered: responses.some((response) => response.email === viewer.email) };
			})
	);
	return { polls, plans: viewer.plans };
}

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const view = cookies.get(VIEW_COOKIE) === 'kalender' ? ('calendar' as const) : ('list' as const);
	const library = await getLibrary();
	const archive = { canAdd: locals.access.rights.has('archiv.bearbeiten') && library.sheet === 'ok', orchestras: config.orchestras };
	const schedule = library.schedule;
	const polls = await openPolls(locals, library.today).catch((error) => {
		console.error('Loading the date polls failed:', error);
		return { polls: [], plans: false };
	});

	// Past concerts: the calendar's recent ones and the history from the sheet, newest first.
	const past = library.concerts.filter((concert) => isPastConcert(concert, library.today)).map(concertSummary);

	// Adding dates: for those who plan them; the form says when the calendar is read-only.
	const adding = locals.access.rights.has('termine.planen')
		? {
				writable: calendarWriteEnabled(),
				concerts: schedule.ok
					? schedule.events.filter((event) => event.type === 'konzert' && !event.past).map((event) => ({ id: event.id, title: event.displayTitle, date: event.date.long }))
					: []
			}
		: null;

	if (!schedule.ok) {
		return { error: schedule.reason, upcoming: [], events: [], today: library.today, view, past, concertTitles: {} as Record<string, string>, subscribeUrl: null, archive, ...polls, adding };
	}

	const concertTitles: Record<string, string> = {};
	for (const event of schedule.events) {
		if (event.type === 'konzert') concertTitles[event.id] = event.displayTitle;
	}

	return {
		error: null,
		upcoming: schedule.events.filter((event) => !event.past),
		// The calendar shows the recent past of the current month too.
		events: schedule.events,
		today: library.today,
		view,
		past,
		concertTitles,
		subscribeUrl: schedule.subscribeUrl,
		archive,
		...polls,
		adding
	};
};

export const actions: Actions = {
	addConcert: ({ locals, request }) => addConcert(locals, request),

	/** A concert or rehearsal into the Google Calendar ("termine.planen", CALENDAR_WRITE). */
	addEvent: async ({ locals, request }) => {
		requireRight(locals, 'termine.planen');
		const form = await request.formData();
		const values = Object.fromEntries([...form].map(([name, value]) => [name, String(value)]));
		if (!calendarWriteEnabled()) return fail(503, { eventError: t.calendar.add.readOnly, eventValues: values });

		const schedule = await getSchedule();
		const concerts = schedule.ok ? schedule.events.filter((event) => event.type === 'konzert' && !event.past) : [];
		const parsed = newEventFromForm(form, { keywords: config.events, timeZone: config.timeZone, concerts });
		if ('error' in parsed) return fail(400, { eventError: t.calendar.add.problems[parsed.error], eventValues: values });

		const result = await addCalendarEvent(parsed.event);
		if (!result.ok) return fail(result.reason === 'failed' ? 503 : 400, { eventError: t.calendar.add.errors[result.reason], eventValues: values });
		return { eventAdded: { id: result.event.id, title: result.event.title } };
	}
};
