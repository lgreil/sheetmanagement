/**
 * A full set of parts to print for a programme (#195): how many copies of each part, from who
 * plays what. One copy per player; strings share a desk, so one per two; the score once.
 */

import type { OrchestraConfig } from '#lib/config/index.ts';
import { matchParts, type InstrumentChoice } from './my-parts.ts';
import type { Part, PartStatus } from './types.ts';

export interface SetPart {
	id: string;
	label: string;
	status: PartStatus;
	pdf: boolean;
	/** Players reading from this part. */
	players: number;
	/** Suggested copies; the librarian can change them before printing. */
	copies: number;
}

/** Players per copy: two at a string desk, one everywhere else. */
const perCopy = (part: Part) => (part.family === 'streicher' ? 2 : 1);

/**
 * The parts of one piece with players and copies. Each entry of `players` is one person's
 * instrument ("Geige II", "Klarinette"). Someone without a number whose instrument has several
 * parts (a "Geige" for Geige I and II) is counted for one of them, taking turns, so the
 * players spread over the parts instead of counting twice. Without an own part, the shared
 * part they read from ("C-Stimmen") counts them.
 */
export function partSet(parts: Part[], players: InstrumentChoice[], config: OrchestraConfig): SetPart[] {
	const counts = new Map<string, number>();
	const turns = new Map<string, number>();
	for (const choice of players) {
		const match = matchParts(parts, choice, config);
		const reads = match.own.length ? match.own : match.shared;
		if (!reads.length) continue;
		const key = reads.map((part) => part.id).join(',');
		const turn = turns.get(key) ?? 0;
		turns.set(key, turn + 1);
		const part = reads[turn % reads.length];
		counts.set(part.id, (counts.get(part.id) ?? 0) + 1);
	}
	return [...parts]
		.sort((a, b) => a.order - b.order)
		.map((part) => {
			const count = counts.get(part.id) ?? 0;
			return {
				id: part.id,
				label: part.label,
				status: part.status,
				pdf: part.mimeType === 'application/pdf',
				players: count,
				copies: part.status !== 'ok' ? 0 : part.kind === 'partitur' ? 1 : Math.ceil(count / perCopy(part))
			};
		});
}
