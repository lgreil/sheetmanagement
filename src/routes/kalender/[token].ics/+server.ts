import { error } from '@sveltejs/kit';
import { playsIn } from '#lib/access/access.ts';
import { t } from '#lib/i18n/index.ts';
import { isOn, orchestra } from '#lib/server/env.ts';
import { feedEvents } from '#lib/events/feed.ts';
import { buildCalendar } from '#lib/events/ical.ts';
import { linkValid } from '#lib/server/auth/links.ts';
import { authConfig } from '#lib/server/auth/index.ts';
import { readFeedToken } from '#lib/server/auth/feed.ts';
import { getLibrary, namedItem } from '#lib/server/library.ts';
import { getAccessList, getRehearsalPlan, getSignups } from '#lib/server/repertoire.ts';
import type { RequestHandler } from './$types';

/** Dates this far back stay in the feed, so last week's rehearsal doesn't vanish at once. */
const PAST_DAYS = 60;

/**
 * A member's personal calendar feed (#122). Calendar apps fetch it without a session, so
 * the signed token in the address is the only key: it must be valid and its version still
 * the one in "Mitglieder". It shows what the member may see anyway, nothing more.
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const auth = authConfig();
	if (auth.mode !== 'on') error(404, 'Nicht eingerichtet.');
	const token = await readFeedToken(params.token, auth.sessionSecret);
	if (!token) error(404, 'Diesen Kalender gibt es nicht.');
	const [access, library, plan, signups] = await Promise.all([getAccessList(), getLibrary(), getRehearsalPlan(), isOn('signups') ? getSignups() : null]);
	const member = access?.membersByEmail.get(token.email);
	// Same answer for a revoked link and an unknown one.
	if (!member || !linkValid(member.feedVersion, token.version)) error(404, 'Diesen Kalender gibt es nicht.');
	if (!library.schedule.ok) error(503, 'Der Kalender ist gerade nicht erreichbar.');

	const concertOf = (id: string) => {
		const event = library.schedule.ok ? library.schedule.byId.get(id) : undefined;
		return library.concertsById.get(event?.type === 'konzert' ? id : (event?.concertId ?? ''));
	};
	const answers = new Map([...(signups?.byEvent ?? [])].map(([id, list]) => [id, list.find((signup) => signup.email === member.email)?.answer]));
	const events = feedEvents({
		events: library.schedule.events,
		// A rehearsal belongs to the orchestra of its concert; dates without one are for everyone.
		includes: (event) => playsIn(member, concertOf(event.id)?.orchestra),
		pieces: (event) =>
			event.type === 'konzert'
				? (library.concertsById.get(event.id)?.program ?? []).map((item) => item.title)
				: (plan?.byEvent.get(event.id) ?? []).map((entry) => namedItem(library, entry.pieceName).title),
		answer: (event) => answers.get(event.id),
		origin: url.origin,
		since: Date.now() - PAST_DAYS * 86_400_000
	});
	return new Response(buildCalendar(t.feed.calendarName(orchestra().name), events), {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': 'inline; filename="termine.ics"',
			'cache-control': 'private, max-age=900'
		}
	});
};
