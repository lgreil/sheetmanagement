import { error } from '@sveltejs/kit';
import { countingMembers } from '#lib/access/access.ts';
import { t } from '#lib/i18n/index.ts';
import { parseInstruments, playedParts } from '#lib/music/my-parts.ts';
import { partSet } from '#lib/music/part-set.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { getLibrary } from '#lib/server/library.ts';
import { getAccessList, getMusicConfig } from '#lib/server/repertoire.ts';
import type { PageServerLoad } from './$types';

/**
 * A full set of parts for a concert (#195): per piece of the programme, the copies of each part
 * from who plays what, to check and change, then printed as one PDF built in the browser.
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	requireRight(locals, 'stuecke.bearbeiten');
	const [library, access, music] = await Promise.all([getLibrary(), getAccessList(), getMusicConfig()]);
	const concert = library.concertsById.get(params.id);
	if (!concert) error(404, t.messages.noConcert);
	// Everyone active in the concert's orchestra, with each of their instruments.
	const members = countingMembers(access?.members ?? [], concert.orchestra, library.today);
	const players = members.flatMap((member) => parseInstruments(member.instrument ?? '', music));
	return {
		concert: { id: concert.id, title: concert.title, date: concert.label?.long ?? concert.dateText },
		players: members.length,
		pieces: concert.program.map((item) => {
			const piece = item.pieceId ? library.piecesById.get(item.pieceId) : undefined;
			const parts = piece?.detail ? playedParts(piece.detail) : [];
			return { title: item.title, pieceId: item.pieceId, parts: partSet(parts, players, music) };
		})
	};
};
