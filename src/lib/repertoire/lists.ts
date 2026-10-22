import { searchText } from '#lib/music/text.ts';

/**
 * Composer, arranger, genre and publisher can name several, separated by commas
 * ("Mozart, Haydn"; "Filmmusik, Pop"). The sheet keeps the text as typed, so it stays easy to
 * edit by hand; the app splits it wherever it compares, filters, links or suggests.
 */

/** The columns that hold a list. */
export const LIST_COLUMNS = ['composer', 'composerFull', 'arranger', 'genre', 'publisher'] as const;

/** "Mozart,  Haydn; Mozart" → ["Mozart", "Haydn"]: trimmed, without empty or repeated names. */
export function splitList(text: string | undefined): string[] {
	const seen = new Set<string>();
	return (text ?? '')
		.split(/[,;]/)
		.map((item) => item.trim().replace(/\s+/g, ' '))
		.filter((item) => {
			const key = searchText(item);
			if (!item || seen.has(key)) return false;
			seen.add(key);
			return true;
		});
}

/** One way of writing a list: "Mozart, Haydn". */
export const joinList = (items: string[]) => items.join(', ');

/** The list as it is saved: "Mozart ,Haydn;" → "Mozart, Haydn". */
export const tidyList = (text: string) => joinList(splitList(text));

/** Whether a list names this one ("Haydn" in "Mozart, Haydn"), ignoring case and accents. */
export function listHas(text: string | undefined, item: string): boolean {
	const wanted = searchText(item.trim());
	return !!wanted && splitList(text).some((entry) => searchText(entry) === wanted);
}

/** Whether two lists share a name: "Mozart, Haydn" and "Haydn" do. */
export function listsOverlap(a: string | undefined, b: string | undefined): boolean {
	return splitList(a).some((item) => listHas(b, item));
}

/** Every name used across many lists, once each, in the order given. */
export function listItems(texts: (string | undefined)[]): string[] {
	return splitList(texts.filter(Boolean).join(','));
}

/**
 * What a datalist offers while typing a list: the names not yet in it, each after what is
 * already typed ("Mozart, " → "Mozart, Haydn"), so picking one adds it instead of replacing all.
 */
export function listCompletions(typed: string, known: string[]): string[] {
	const done = typed.includes(',') || typed.includes(';') ? typed.replace(/[^,;]*$/, '') : '';
	const prefix = done ? `${joinList(splitList(done))}, ` : '';
	return known.filter((item) => !listHas(done, item)).map((item) => prefix + item);
}
