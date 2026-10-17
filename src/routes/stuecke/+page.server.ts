import { getCatalog } from '#lib/server/catalog.ts';
import type { PieceSummary } from '#lib/music/types.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const result = await getCatalog();
	if (!result.ok) return { error: result.reason, pieces: [] as PieceSummary[], categories: [] as string[] };

	// Only what the list shows; the parts stay on the server.
	const pieces: PieceSummary[] = result.catalog.pieces.map(
		({ id, title, composer, catalogue, category, partCount, status, search }) => ({
			id,
			title,
			composer,
			catalogue,
			category,
			partCount,
			status,
			search
		})
	);
	const categories = [...new Set(pieces.map((piece) => piece.category).filter((c): c is string => !!c))];
	return { error: null, pieces, categories };
};
