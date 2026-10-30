import { error } from '@sveltejs/kit';
import { countingMembers } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { parseInstruments, playedParts } from '#lib/music/my-parts.ts';
import { partSet } from '#lib/music/part-set.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { getLibrary } from '#lib/server/library.ts';
import { getAccessList, getMusicConfig } from '#lib/server/repertoire.ts';
import type { PageServerLoad } from './$types';

/**
 * The Stimmensatz of one piece (#251), e.g. for a rehearsal weekend or a piece handed out early:
 * the copies from who plays in the chosen orchestra (?orchester=), or in all of them.
 */
export const load: PageServerLoad = async ({ params, locals, url }) => {
	requireRight(locals, 'stuecke.bearbeiten');
	const [library, access, music] = await Promise.all([getLibrary(), getAccessList(), getMusicConfig()]);
	const piece = library.piecesById.get(params.id);
	if (!piece) error(404, t.messages.noPiece);
	const orchestra = config.orchestras.find((name) => name === url.searchParams.get('orchester')) ?? '';
	const members = countingMembers(access?.members ?? [], orchestra || undefined, library.today);
	const players = members.flatMap((member) => parseInstruments(member.instrument ?? '', music));
	return {
		back: { href: `/stuecke/${encodeURIComponent(piece.id)}`, label: piece.title },
		title: piece.title,
		players: members.length,
		orchestra,
		orchestras: config.orchestras,
		pieces: [{ title: piece.title, parts: partSet(piece.detail ? playedParts(piece.detail) : [], players, music) }]
	};
};
