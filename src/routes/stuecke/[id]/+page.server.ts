import { error } from '@sveltejs/kit';
import { fileUrl, folderUrl } from '#lib/server/catalog.ts';
import { searchText } from '#lib/music/text.ts';
import { workKey } from '#lib/music/piece-name.ts';
import { concertSummary, getLibrary, type LibraryPiece } from '#lib/server/library.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const library = await getLibrary();
	const piece = library.piecesById.get(params.id);
	if (!piece) {
		if (!library.catalog.ok) error(503, 'Das Notenarchiv ist gerade nicht erreichbar.');
		error(404, 'Dieses Stück gibt es nicht (mehr) im Notenarchiv.');
	}

	const { detail, sheet } = piece;
	const byComposer = piece.composer
		? library.pieces.filter((other) => other.id !== piece.id && sameComposer(other.composer, piece.composer))
		: [];
	const work = workKey(piece.title);
	return {
		piece: {
			id: piece.id,
			title: piece.title,
			composer: piece.composer,
			catalogue: piece.catalogue,
			category: piece.category,
			programs: piece.programs,
			partCount: piece.partCount,
			status: piece.status,
			folderUrl: detail ? folderUrl(detail.id) : undefined,
			parts: (detail?.parts ?? []).map((part) => ({ ...part, url: fileUrl(part.id, part.mimeType) })),
			sections: (detail?.sections ?? []).map((section) => ({ ...section, folderUrl: folderUrl(section.folderId) })),
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
		// Other folders of the same work ("Sinfonie Nr4 Satz 2 - Streicherbesetzung"), then
		// "Weitere Werke von Bach": the same composer, as read from the folder or corrected in the sheet.
		otherVersions: byComposer.filter((other) => work && workKey(other.title) === work).map(summary),
		moreByComposer: byComposer.filter((other) => !work || workKey(other.title) !== work).map(summary),
		sheet: library.sheet
	};
};

const sameComposer = (a: string | undefined, b: string | undefined) => !!a && !!b && searchText(a) === searchText(b);

const summary = ({ id, title, catalogue, status, programs }: LibraryPiece) => ({ id, title, catalogue, status, programs });
