import { searchText } from '#lib/music/text.ts';
import { splitList } from './lists.ts';

/**
 * Several orchestras can play one concert ("EO, A" under "Orchester"), each with its own
 * programme: a row in "Programm" names its orchestra, or belongs to the first one named.
 */

/** "EO, A" → ["EO", "A"]. */
export const concertOrchestras = (text: string | undefined): string[] => splitList(text);

export const sameOrchestra = (a: string | undefined, b: string | undefined) => searchText((a ?? '').trim()) === searchText((b ?? '').trim());

/** The orchestra a programme row belongs to: the one it names, else the concert's first. */
export function rowOrchestra(entered: string | undefined, orchestras: string[]): string | undefined {
	if (!entered?.trim()) return orchestras[0];
	return orchestras.find((orchestra) => sameOrchestra(orchestra, entered)) ?? entered.trim();
}

/** The orchestra to show or edit: the one asked for if the concert has it, else its first. */
export function pickOrchestra(orchestras: string[], wanted: string | null | undefined): string | undefined {
	return orchestras.find((orchestra) => sameOrchestra(orchestra, wanted ?? '')) ?? orchestras[0];
}
