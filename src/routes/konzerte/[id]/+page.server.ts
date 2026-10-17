import { error } from '@sveltejs/kit';
import { getSchedule } from '#lib/server/schedule.ts';
import type { ShownEvent } from '#lib/events/schedule.ts';
import type { PageServerLoad } from './$types';

/** Calendar descriptions may contain simple HTML; the page shows plain text. */
function plainText(html: string | undefined): string | undefined {
	if (!html) return undefined;
	const text = html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|li)>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
	return text || undefined;
}

export const load: PageServerLoad = async ({ params }) => {
	const result = await getSchedule();
	if (!result.ok) error(503, 'Der Kalender ist gerade nicht erreichbar.');

	const event = result.byId.get(params.id);
	if (!event) error(404, 'Diesen Termin gibt es nicht (mehr) im Kalender.');

	const lookup = (id: string) => result.byId.get(id);
	const rehearsals = event.rehearsalIds.map(lookup).filter((e): e is ShownEvent => !!e);
	const concert = event.concertId ? lookup(event.concertId) : undefined;

	return {
		event: { ...event, description: plainText(event.description) },
		rehearsals,
		concert,
		mapUrl: event.location
			? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
			: undefined
	};
};
