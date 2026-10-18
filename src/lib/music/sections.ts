/**
 * Most piece folders hold one set of parts. Some hold several in subfolders:
 * a symphony with a folder per movement ("1er Satz", "4ter Satz"), or the parts the
 * orchestra plays directly in the folder plus the complete work in "Komplett".
 * Each set is a section, shown as its own tab on the piece page.
 */

export type SectionKind =
	/** The files directly in the piece folder, next to subfolders: what is played. */
	| 'played'
	/** One movement, e.g. "1er Satz". */
	| 'movement'
	/** The complete work, e.g. "Komplett". */
	| 'complete'
	/** Any other subfolder, shown by its name. */
	| 'other';

export interface SectionName {
	label: string;
	kind: SectionKind;
	movement?: number;
}

const MOVEMENT = [/^\s*(\d+)\s*(?:\.|er|ter|te|tr|r)?\s*satz\b/i, /\bsatz\s*(\d+)\b/i, /^\s*(\d+)\s*(?:\.|er|ter)?\s*mov(?:ement)?\b/i, /\bmov(?:ement)?\s*(\d+)\b/i];
const COMPLETE = /\b(komplett|vollständig|gesamt|gesamtausgabe|complete|full)\b/i;

/** "1er Satz" → "1. Satz", "Komplett" → "Komplett", anything else stays as it is. */
export function sectionName(folderName: string): SectionName {
	const name = folderName.trim();
	for (const pattern of MOVEMENT) {
		const number = Number(pattern.exec(name)?.[1]);
		if (number) return { label: `${number}. Satz`, kind: 'movement', movement: number };
	}
	if (COMPLETE.test(name)) return { label: 'Komplett', kind: 'complete' };
	return { label: name, kind: 'other' };
}

/**
 * The movement all given file names share, e.g. "Mendelssohn 4 - Satz 2 - Flöte I" → 2.
 * Used to name the played section; undefined when the files don't agree.
 */
export function sharedMovement(fileNames: string[]): number | undefined {
	const numbers = fileNames.map((name) => Number(/\bsatz\s*(\d+)\b/i.exec(name)?.[1]) || undefined);
	const first = numbers[0];
	return first !== undefined && numbers.every((n) => n === first) ? first : undefined;
}

/** Played first, then movements in order, other folders by name, the complete work last. */
export function compareSections(a: SectionName, b: SectionName): number {
	const rank = { played: 0, movement: 1, other: 2, complete: 3 } as const;
	return (
		rank[a.kind] - rank[b.kind] ||
		(a.movement ?? 0) - (b.movement ?? 0) ||
		a.label.localeCompare(b.label, 'de', { numeric: true })
	);
}
