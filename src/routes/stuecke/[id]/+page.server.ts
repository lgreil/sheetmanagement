import { error } from '@sveltejs/kit';
import { fileUrl, folderUrl } from '#lib/server/catalog.ts';
import { concertSummary, getLibrary } from '#lib/server/library.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const library = await getLibrary();
	const piece = library.piecesById.get(params.id);
	if (!piece) {
		if (!library.catalog.ok) error(503, 'Das Notenarchiv ist gerade nicht erreichbar.');
		error(404, 'Dieses Stück gibt es nicht (mehr) im Notenarchiv.');
	}

	const { detail, sheet } = piece;
	return {
		piece: {
			id: piece.id,
			title: piece.title,
			composer: piece.composer,
			catalogue: piece.catalogue,
			category: piece.category,
			partCount: piece.partCount,
			status: piece.status,
			folderUrl: detail ? folderUrl(detail.id) : undefined,
			parts: (detail?.parts ?? []).map((part) => ({ ...part, url: fileUrl(part.id, part.mimeType) })),
			info: {
				arranger: sheet?.arranger,
				genre: sheet?.genre,
				difficulty: sheet?.difficulty,
				reviewedAt: sheet?.reviewedAt,
				notes: sheet?.notes
			}
		},
		playedAt: piece.playedAt
			.map((id) => library.concertsById.get(id))
			.filter((concert) => concert !== undefined)
			.map(concertSummary),
		sheet: library.sheet
	};
};
