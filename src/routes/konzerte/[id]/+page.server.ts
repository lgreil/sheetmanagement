import { error } from '@sveltejs/kit';
import { getLibrary } from '#lib/server/library.ts';
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

const mapUrl = (location: string | undefined) =>
	location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : undefined;

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const library = await getLibrary();
	const schedule = library.schedule;
	const event = schedule.ok ? schedule.byId.get(params.id) : undefined;
	// Concerts from the sheet: from the orchestra's history, or no longer in the calendar.
	const concert = library.concertsById.get(params.id);

	if (!event && !concert) {
		if (!schedule.ok) error(503, 'Der Kalender ist gerade nicht erreichbar.');
		error(404, 'Diesen Termin gibt es nicht (mehr) im Kalender.');
	}

	const program = {
		items: concert?.program ?? [],
		canEdit: locals.access.rights.has('programme.bearbeiten') && !!concert?.sheet,
		saved: url.searchParams.has('gespeichert'),
		sheet: library.sheet
	};

	if (!event) {
		const { title, label, dateText, location, orchestra } = concert!;
		return { kind: 'archive' as const, archive: { title, label, dateText, location, orchestra }, mapUrl: mapUrl(location), program };
	}

	const lookup = (id: string) => (schedule.ok ? schedule.byId.get(id) : undefined);
	return {
		kind: 'event' as const,
		event: { ...event, description: plainText(event.description) },
		rehearsals: event.rehearsalIds.map(lookup).filter((e): e is ShownEvent => !!e),
		concert: event.concertId ? lookup(event.concertId) : undefined,
		mapUrl: mapUrl(event.location),
		program
	};
};
