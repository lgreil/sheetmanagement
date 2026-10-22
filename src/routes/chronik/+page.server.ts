import { chronicleStats, timeline } from '#lib/repertoire/chronicle.ts';
import { getChronicle } from '#lib/server/chronicle.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { library, past, planned, archive } = await getChronicle();
	const labels = new Map(past.map((concert) => [concert.id, concert.label]));
	return {
		sheet: library.sheet,
		stats: chronicleStats(past, archive, Number(library.today.slice(0, 4)), planned),
		timeline: timeline(past).map((decade) => ({
			...decade,
			years: decade.years.map((year) => ({
				...year,
				concerts: year.concerts.map((concert) => ({ ...concert, label: labels.get(concert.id) ?? '' }))
			}))
		})),
		// The season report for the annual meeting (#147) is for the board.
		canReport: locals.access.rights.has('mitglieder.verwalten')
	};
};
