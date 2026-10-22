import { listItems, splitList } from './lists.ts';
import { normalize } from './sheet.ts';

/**
 * Suggestions while planning a programme (#91, #108): pieces members wished for this
 * concert or any time, sorted by +1s, and archive pieces not played for a long time.
 * Each says whether it adds a genre the programme doesn't have yet.
 */

export interface SuggestPiece {
	id: string;
	title: string;
	genre?: string;
	/** Date key of the last concert it was in ("1998-12"), if any. */
	lastPlayed?: string;
	/** Can be added to the programme: it has a row in "Stücke". */
	pickable: boolean;
}

export interface SuggestWish {
	id: string;
	title: string;
	pieceId?: string;
	/** Concert title as entered; empty: any time. */
	concert: string;
	votes: number;
	status: 'open' | 'planned' | 'done' | 'declined';
}

export interface Suggestion {
	/** Archive piece, or undefined for a wished piece that isn't in the archive. */
	pieceId?: string;
	title: string;
	votes: number;
	/** The wishes it comes from; taking it into the programme marks them "geplant". */
	wishIds: string[];
	/** Wished for exactly this concert (not just "irgendwann"). */
	forThisConcert: boolean;
	lastPlayed?: string;
	genre?: string;
	/** A genre the programme doesn't have yet. */
	newGenre: boolean;
}

/** Played longer ago than this counts as "lange nicht gespielt". */
export const LONG_AGO_YEARS = 8;

export function programSuggestions(input: {
	concertTitle: string;
	programPieceIds: string[];
	pieces: SuggestPiece[];
	wishes: SuggestWish[];
	/** "2026-10-20" */
	today: string;
	longAgo?: number;
}): { wished: Suggestion[]; longAgo: Suggestion[]; genres: string[] } {
	const byId = new Map(input.pieces.map((piece) => [piece.id, piece]));
	const inProgram = new Set(input.programPieceIds);
	const genres = listItems(input.programPieceIds.map((id) => byId.get(id)?.genre));
	const known = new Set(genres.map(normalize));
	// "Filmmusik, Pop" brings something new if one of its genres isn't in the programme yet.
	const isNew = (genre?: string) => splitList(genre).some((item) => !known.has(normalize(item)));

	// Wishes for this concert or any time, still open or planned; one entry per piece.
	const wished = new Map<string, Suggestion>();
	for (const wish of input.wishes) {
		if (wish.status !== 'open' && wish.status !== 'planned') continue;
		const forThisConcert = !!wish.concert && normalize(wish.concert) === normalize(input.concertTitle);
		if (wish.concert && !forThisConcert) continue;
		const piece = wish.pieceId ? byId.get(wish.pieceId) : undefined;
		if (piece && inProgram.has(piece.id)) continue;
		const key = piece ? `p:${piece.id}` : `t:${normalize(wish.title)}`;
		const entry = wished.get(key) ?? {
			pieceId: piece?.pickable ? piece.id : undefined,
			title: piece?.title ?? wish.title,
			votes: 0,
			wishIds: [],
			forThisConcert: false,
			lastPlayed: piece?.lastPlayed,
			genre: piece?.genre,
			newGenre: isNew(piece?.genre)
		};
		entry.votes += wish.votes;
		entry.wishIds.push(wish.id);
		entry.forThisConcert ||= forThisConcert;
		wished.set(key, entry);
	}

	const cutoff = String(Number(input.today.slice(0, 4)) - (input.longAgo ?? LONG_AGO_YEARS));
	const taken = new Set([...wished.values()].flatMap((s) => s.pieceId ?? []));
	const longAgo = input.pieces
		.filter((piece) => piece.pickable && piece.lastPlayed && piece.lastPlayed < cutoff && !inProgram.has(piece.id) && !taken.has(piece.id))
		.sort((a, b) => Number(isNew(b.genre)) - Number(isNew(a.genre)) || a.lastPlayed!.localeCompare(b.lastPlayed!))
		.slice(0, 8)
		.map((piece) => ({
			pieceId: piece.id,
			title: piece.title,
			votes: 0,
			wishIds: [],
			forThisConcert: false,
			lastPlayed: piece.lastPlayed,
			genre: piece.genre,
			newGenre: isNew(piece.genre)
		}));

	return {
		wished: [...wished.values()].sort((a, b) => b.votes - a.votes || Number(b.forThisConcert) - Number(a.forThisConcert)),
		longAgo,
		genres
	};
}
