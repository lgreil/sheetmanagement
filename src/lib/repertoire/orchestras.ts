import { t } from '#lib/i18n/index.ts';
import { searchText } from '#lib/music/text.ts';
import { joinList, splitList } from './lists.ts';

/**
 * Several orchestras can play one concert ("EO, A" under "Orchester"), each with its own
 * programme: a row in "Programm" names its orchestra. A row naming several ("EO, A") is a
 * piece they play together: it's in each one's music. Playing together is the usual case,
 * so a row naming none belongs to all of the concert's orchestras.
 */

/** "EO, A" → ["EO", "A"]. */
export const concertOrchestras = (text: string | undefined): string[] => splitList(text);

export const sameOrchestra = (a: string | undefined, b: string | undefined) => searchText((a ?? '').trim()) === searchText((b ?? '').trim());

/**
 * The orchestra a programme row belongs to: the one it names, else all of the concert's.
 * Several named ("a, eo") become one way of writing them, in the concert's order ("EO, A").
 */
export function rowOrchestra(entered: string | undefined, orchestras: string[]): string | undefined {
	const named = splitList(entered).map((name) => orchestras.find((orchestra) => sameOrchestra(orchestra, name)) ?? name);
	if (!named.length) return orchestras.length ? joinList(orchestras) : undefined;
	const rank = (name: string) => {
		const index = orchestras.indexOf(name);
		return index === -1 ? orchestras.length : index;
	};
	return joinList([...named].sort((a, b) => rank(a) - rank(b)));
}

/** Whether a row's orchestra ("EO" or, played together, "EO, A") includes this one. */
export const playedBy = (rowValue: string | undefined, orchestra: string | undefined) =>
	orchestra === undefined ? !rowValue : splitList(rowValue).some((name) => sameOrchestra(name, orchestra));

/** Played together by several orchestras. */
export const isJoint = (rowValue: string | undefined) => splitList(rowValue).length > 1;

/** "Programm EO", or "Gemeinsam: EO + A" for what they play together. */
export function programLabel(orchestra: string): string {
	const names = splitList(orchestra);
	return names.length > 1 ? t.editor.jointTab(names) : t.editor.orchestraTab(orchestra);
}

/** The concert's programmes to edit: one per orchestra and, for several, the one they play together. */
export function programScopes(orchestras: string[]): string[] {
	return orchestras.length > 1 ? [...orchestras, joinList(orchestras)] : orchestras;
}

/** The programme to show or edit: the one asked for if the concert has it, else its first orchestra's. */
export function pickOrchestra(orchestras: string[], wanted: string | null | undefined): string | undefined {
	const scopes = programScopes(orchestras);
	const asked = wanted ? rowOrchestra(wanted, orchestras) : undefined;
	return scopes.find((scope) => sameOrchestra(scope, asked)) ?? orchestras[0];
}

/**
 * Values offered in the sheet's "Orchester" dropdowns: each orchestra and every combination,
 * "EO, A" for pieces or concerts they play together. Only for a few orchestras.
 */
export function orchestraChoices(orchestras: string[]): string[] {
	if (orchestras.length > 4) return orchestras;
	const combinations = Array.from({ length: 2 ** orchestras.length - 1 }, (_, i) => orchestras.filter((_, bit) => (i + 1) & (1 << bit)));
	return combinations.sort((a, b) => a.length - b.length).map(joinList);
}
