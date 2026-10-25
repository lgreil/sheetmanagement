import type { Part } from './types.ts';

/**
 * Hints about parts that may be empty or incomplete (#93), from their page counts, so
 * nobody has to notice and write LEER or UNVOLLSTÄNDIG into the file name first. Only
 * hints: an organiser confirms one (the file gets the status word) or dismisses it.
 */

export type PartHint = { id: string; problem: 'empty' } | { id: string; problem: 'incomplete'; pages: number; usual: number };

/** What the check found for a file: its pages, or null when it couldn't be read as a PDF. */
export type PageCounts = Map<string, number | null>;

const MUSIC = new Set<Part['kind']>(['stimme', 'sammelstimme', 'solo']);

const median = (values: number[]) => {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = sorted.length >> 1;
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/**
 * Parts whose name says nothing yet: unreadable or without pages → "empty"; at most half
 * the pages most parts of the same piece (and section) have, two or more fewer → "incomplete".
 * The score has more pages anyway and is left out, as are pieces with fewer than three parts.
 */
export function partHints(parts: Pick<Part, 'id' | 'kind' | 'status' | 'section' | 'mimeType'>[], pages: PageCounts, dismissed: Set<string> = new Set()): PartHint[] {
	const music = parts.filter((part) => MUSIC.has(part.kind) && part.mimeType === 'application/pdf' && pages.has(part.id));
	const hints: PartHint[] = [];
	for (const section of new Set(music.map((part) => part.section))) {
		const inSection = music.filter((part) => part.section === section);
		const counted = inSection.map((part) => pages.get(part.id)).filter((n): n is number => !!n);
		const usual = counted.length >= 3 ? median(counted) : undefined;
		for (const part of inSection) {
			if (part.status !== 'ok' || dismissed.has(part.id)) continue;
			const n = pages.get(part.id);
			if (!n) hints.push({ id: part.id, problem: 'empty' });
			else if (usual && n <= usual / 2 && usual - n >= 2) hints.push({ id: part.id, problem: 'incomplete', pages: n, usual: Math.round(usual) });
		}
	}
	return hints;
}
