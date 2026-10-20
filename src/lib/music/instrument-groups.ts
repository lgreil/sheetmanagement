import { isDone } from '#lib/repertoire/missing-parts.ts';
import { LAYOUT, normalize, readTable } from '#lib/repertoire/sheet.ts';

/**
 * The "Instrumentgruppen" tab: who plays from which part. A row "B-Stimmen | Klarinette,
 * Trompete" means clarinets and trumpets also read the B part. A row marked
 * "Gegenseitig" makes everyone named read each other's parts, e.g. "Percussion |
 * Schlagwerk, Mallet Percussion". Once the tab has rows it replaces the preset's
 * defaults, so the orchestra decides.
 */

export type SharedParts = Record<string, string[]>;

export interface InstrumentGroup {
	row: number;
	part: string;
	players: string[];
	mutual: boolean;
	note: string;
}

export interface InstrumentGroups {
	groups: InstrumentGroup[];
	/** The groups as Meine Noten and the instrumentation check use them. */
	sharedParts: SharedParts;
	/** Names that aren't a configured instrument, so they match nothing. */
	unknown: string[];
}

/** "Klarinette, Trompete / Horn" → ["Klarinette", "Trompete", "Horn"] */
export const splitNames = (text: string) =>
	text
		.split(/[,;/\n]+/)
		.map((name) => name.trim())
		.filter(Boolean);

/** Reads the tab; null when it has no rows, so the preset's defaults apply. Names are matched to the instruments ignoring case. */
export function readInstrumentGroups(values: string[][] | undefined, instruments: string[]): InstrumentGroups | null {
	if (!values) return null;
	const table = readTable(values, LAYOUT.instrumentGroups.columns);
	const byKey = new Map(instruments.map((name) => [normalize(name), name]));
	const unknown = new Set<string>();
	const canonical = (name: string) => {
		const found = byKey.get(normalize(name));
		if (!found) unknown.add(name);
		return found ?? name;
	};
	const groups = table.rows
		.filter(({ values: v }) => v.part)
		.map(({ row, values: v }) => ({
			row,
			part: canonical(v.part),
			players: splitNames(v.players).map(canonical),
			mutual: isDone(v.mutual),
			note: v.note
		}));
	if (!groups.length) return null;
	return { groups, sharedParts: toSharedParts(groups), unknown: [...unknown] };
}

/** Rows → { part: [players] }; a mutual row gives every member everyone else. */
export function toSharedParts(groups: Pick<InstrumentGroup, 'part' | 'players' | 'mutual'>[]): SharedParts {
	const shared: SharedParts = {};
	const add = (part: string, player: string) => {
		if (part === player) return;
		const players = (shared[part] ??= []);
		if (!players.includes(player)) players.push(player);
	};
	for (const group of groups) {
		const members = [group.part, ...group.players];
		for (const player of group.players) add(group.part, player);
		if (group.mutual) for (const part of members) for (const player of members) add(part, player);
	}
	return shared;
}

/** The preset's defaults as rows, to fill a new tab with something to edit. */
export function defaultRows(shared: SharedParts = {}): string[][] {
	return Object.entries(shared).map(([part, players]) => [part, players.join(', '), '', '']);
}
