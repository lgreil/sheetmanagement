import { error } from '@sveltejs/kit';
import { getLibrary } from '#lib/server/library.ts';
import type { PageServerLoad } from './$types';

/** A concert's programme to print: a handout for the audience, or the conductor's setlist. */
export const load: PageServerLoad = async ({ params, url }) => {
	const library = await getLibrary();
	const concert = library.concertsById.get(params.id);
	if (!concert) error(404, 'Dieses Konzert gibt es nicht.');
	return {
		kind: url.searchParams.get('art') === 'setlist' ? ('setlist' as const) : ('handout' as const),
		concert: {
			id: concert.id,
			title: concert.title,
			date: concert.label?.long ?? concert.dateText,
			time: concert.event?.date.time || undefined,
			location: concert.location
		},
		items: concert.program.map(({ title, subtitle, notes }) => ({ title, subtitle, notes }))
	};
};
