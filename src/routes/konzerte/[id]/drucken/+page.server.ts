import { error } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { reportGaps, reportRows } from '#lib/repertoire/music-report.ts';
import { getLibrary, reportPieces } from '#lib/server/library.ts';
import type { PageServerLoad } from './$types';

/**
 * A concert's programme to print: a handout for the audience, the conductor's setlist, or
 * for planners the music list for the collecting society (#118).
 */
export const load: PageServerLoad = async ({ params, url, locals }) => {
	const library = await getLibrary();
	const concert = library.concertsById.get(params.id);
	if (!concert) error(404, 'Dieses Konzert gibt es nicht.');
	const canReport = config.musicReport !== false && locals.access.rights.has('programme.bearbeiten');
	const art = url.searchParams.get('art');
	const kind = art === 'setlist' ? ('setlist' as const) : art === 'musikfolge' && canReport ? ('musikfolge' as const) : ('handout' as const);
	const pieces = reportPieces(library, concert);
	return {
		kind,
		canReport,
		concert: {
			id: concert.id,
			title: concert.title,
			date: concert.label?.long ?? concert.dateText,
			time: concert.event?.date.time || undefined,
			location: concert.location
		},
		items: concert.program.map(({ title, subtitle, notes, duration }) => ({ title, subtitle, notes, duration })),
		report:
			kind === 'musikfolge'
				? { rows: reportRows(pieces), gaps: reportGaps(pieces), canFill: locals.access.rights.has('stuecke.bearbeiten') }
				: null
	};
};
