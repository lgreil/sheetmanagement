import { splitList } from '#lib/repertoire/lists.ts';
import { searchText } from './text.ts';

/**
 * The picture on a piece's banner when its composer has no portrait (see server/portraits.ts):
 * the genre's picture, else notes on a staff (titles A–G) or a violin (the rest), so pieces
 * without either still look different from each other.
 */

export type GenreKey = 'weihnachten' | 'filmmusik' | 'musical' | 'oper' | 'jazz' | 'pop-rock' | 'marsch-blasmusik' | 'tanz-walzer';
export type ArtKey = GenreKey | 'staff' | 'violin';

/** Words in a genre and the picture they get, in this order: "Weihnachtsmusical" is Christmas. */
const GENRES: { key: GenreKey; words: RegExp }[] = [
	{ key: 'weihnachten', words: /weihnacht|christmas|advent|xmas/ },
	{ key: 'filmmusik', words: /film|soundtrack|movie|serie/ },
	{ key: 'musical', words: /musical/ },
	{ key: 'oper', words: /\boper|opera|operette|singspiel/ },
	{ key: 'jazz', words: /jazz|swing|big ?band|blues|latin/ },
	{ key: 'pop-rock', words: /\bpop|rock|schlager/ },
	{ key: 'marsch-blasmusik', words: /marsch|march|blasmusik|blasorchester/ },
	{ key: 'tanz-walzer', words: /walzer|waltz|tanz|dance|polka|tango|menuett/ }
];

export function pieceArt({ genre, title }: { genre?: string; title: string }): ArtKey {
	for (const name of splitList(genre).map((part) => searchText(part))) {
		const match = GENRES.find((entry) => entry.words.test(name));
		if (match) return match.key;
	}
	// Leading articles and numbers don't count: "Die Moldau" is an M, "1812" has no letter.
	const letter = searchText(title)
		.replace(/^(der|die|das|the|a|an|le|la|les|il|el)\s+/, '')
		.match(/[a-z]/)?.[0];
	return letter && letter <= 'g' ? 'staff' : 'violin';
}
