import { normalizeEmail } from '#lib/access/access.ts';
import { matchParts, parseInstruments, playedParts } from '#lib/music/my-parts.ts';
import type { Part, PieceDetail } from '#lib/music/types.ts';
import type { Catalog } from '#lib/music/catalog.ts';
import type { OrchestraConfig } from '#lib/config/index.ts';
import { DAY_CAP_SECONDS } from '#lib/practice/practice.ts';
import { getStore } from './db/index.ts';
import { today } from './members.ts';

const PDF = 'application/pdf';

/**
 * A PDF of the member's own instrument, as "Meine Noten" lists it (their own parts and the
 * shared ones they may play from), with its piece; null for any other file. Only these count as
 * practice time.
 */
export function ownPart(catalog: Catalog, instrument: string, music: OrchestraConfig, fileId: string): { piece: PieceDetail; part: Part } | null {
	const choices = parseInstruments(instrument, music);
	if (!choices.length) return null;
	for (const piece of catalog.pieces) {
		const parts = playedParts(piece);
		const part = parts.find((p) => p.id === fileId && p.mimeType === PDF);
		if (!part) continue;
		const mine = choices.some((choice) => {
			const match = matchParts(parts, choice, music);
			return match.own.includes(part) || match.shared.includes(part);
		});
		return mine ? { piece, part } : null;
	}
	return null;
}

/** Adds one report from the practice viewer to the member's day, if they turned practice time on. */
export async function recordPractice(email: string, seconds: number): Promise<boolean> {
	const store = getStore();
	const member = normalizeEmail(email);
	if (seconds <= 0 || !(await store.practiceOn(member))) return false;
	await store.addPractice(member, today(), seconds, DAY_CAP_SECONDS);
	return true;
}
