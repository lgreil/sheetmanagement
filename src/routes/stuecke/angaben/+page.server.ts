import { DETAIL_FILTERS, gapCounts, gapsOf, parseGapFilter } from '#lib/repertoire/details.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { getLibrary } from '#lib/server/library.ts';
import type { PageServerLoad } from './$types';

/** Pieces with gaps in their details, to work through on the edit page one after another. */
export const load: PageServerLoad = async ({ locals, url }) => {
	requireRight(locals, 'stuecke.bearbeiten');
	const library = await getLibrary();
	const filter = parseGapFilter(url.searchParams.get('filter')) ?? 'alle';
	const counts = gapCounts(library.pieces);
	return {
		filter,
		filters: DETAIL_FILTERS.map((value) => ({ value, count: counts[value] })),
		total: library.pieces.filter((piece) => piece.sheet).length,
		done: url.searchParams.has('fertig'),
		pieces: library.pieces
			.map((piece) => ({ id: piece.id, title: piece.title, composer: piece.composer, catalogue: piece.catalogue, gaps: gapsOf(piece, filter) }))
			.filter((piece) => piece.gaps.length)
	};
};
