import { pieceKey, type ChronicleConcert, type ChroniclePiece } from '#lib/repertoire/chronicle.ts';
import { getLibrary, isPastConcert, type Library, type LibraryConcert } from './library.ts';

export interface ShownChronicleConcert extends ChronicleConcert {
	/** "Samstag, 21. Dezember 1957", "Dezember 1957", "1957" or the date as entered. */
	label: string;
}

/** A concert as the Chronik counts it: the programme with each piece's composer. */
function chronicleConcert(library: Library, concert: LibraryConcert): ShownChronicleConcert {
	return {
		id: concert.id,
		title: concert.title,
		dateKey: concert.dateKey,
		label: concert.label?.long ?? concert.dateText ?? '',
		location: concert.location,
		program: concert.program.map((item) => ({
			title: item.title,
			pieceId: item.pieceId,
			composer: item.pieceId ? library.piecesById.get(item.pieceId)?.composer : undefined
		}))
	};
}

/** The past concerts and the archive, for the Chronik (#61) and the season report (#147). */
export async function getChronicle(): Promise<{ library: Library; past: ShownChronicleConcert[]; planned: Set<string>; archive: ChroniclePiece[] }> {
	const library = await getLibrary();
	const coming = library.concerts.filter((concert) => !isPastConcert(concert, library.today));
	return {
		library,
		past: library.concerts.filter((concert) => isPastConcert(concert, library.today)).map((concert) => chronicleConcert(library, concert)),
		// Pieces on the programme of a coming concert.
		planned: new Set(coming.flatMap((concert) => concert.program.map(pieceKey))),
		archive: library.pieces.map((piece) => ({ id: piece.id, title: piece.title, composer: piece.composer, hasMusic: !!piece.detail }))
	};
}
