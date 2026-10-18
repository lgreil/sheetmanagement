import { fileUrl } from '#lib/server/catalog.ts';
import { getLibrary } from '#lib/server/library.ts';
import type { PieceSummary } from '#lib/music/types.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const library = await getLibrary();
	if (!library.catalog.ok) {
		return {
			error: library.catalog.reason,
			pieces: [] as PieceSummary[],
			categories: [] as string[],
			programs: [] as string[],
			categoryFiles: {} as Record<string, { id: string; name: string; url: string }[]>
		};
	}

	// Only what the list shows; the parts stay on the server.
	const pieces: PieceSummary[] = library.pieces.map(
		({ id, title, composer, catalogue, category, programs, partCount, status, search }) => ({
			id,
			title,
			composer,
			catalogue,
			category,
			programs,
			partCount,
			status,
			search
		})
	);
	const categories = [...new Set(pieces.map((piece) => piece.category).filter((c): c is string => !!c))];
	// Loose files in a category folder, e.g. the running order of the Christmas pieces.
	const categoryFiles = Object.fromEntries(
		Object.entries(library.catalog.catalog.categoryFiles).map(([category, files]) => [
			category,
			files.map((file) => ({ id: file.id, name: file.name.replace(/\.pdf$/i, ''), url: fileUrl(file.id, file.mimeType) }))
		])
	);
	return { error: null, pieces, categories, programs: library.catalog.catalog.programs, categoryFiles };
};
