import { error, redirect } from '@sveltejs/kit';
import { normalizeEmail } from '#lib/access/access.ts';
import { t } from '#lib/i18n/index.ts';
import { youtubeId } from '#lib/links.ts';
import { partUrl, getCatalog } from '#lib/server/catalog.ts';
import { getStore } from '#lib/server/db/index.ts';
import { getLibrary } from '#lib/server/library.ts';
import { today } from '#lib/server/members.ts';
import { offersFor, ownPart } from '#lib/server/practice.ts';
import { getAccessList, getMusicConfig } from '#lib/server/repertoire.ts';
import type { PageServerLoad } from './$types';

const PDF = 'application/pdf';

/**
 * The practice viewer: a part of the member's own instrument, drawn in the app page by page,
 * with the piece's recording, a metronome, a tuner and the member's own pen marks, and what others
 * in their section offer of theirs. With practice
 * time on, the time it's open counts. Another instrument's part, or sign-in off, opens where
 * "Meine Noten" would open it.
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	const elsewhere = () => redirect(303, partUrl(params.id, PDF, locals.access.viaLink));
	const user = locals.access.user;
	if (locals.auth !== 'on' || !user || !locals.access.member) elsewhere();
	const email = normalizeEmail(user!.email);
	const store = getStore();
	const [catalog, access, music, library, on] = await Promise.all([
		getCatalog(),
		getAccessList(),
		getMusicConfig(),
		getLibrary(),
		store.practiceOn(email).catch(() => false)
	]);
	if (!catalog.ok) error(503, t.messages.archiveUnavailable);
	const member = access?.membersByEmail.get(email);
	const found = member && ownPart(catalog.catalog, member.instrument ?? '', music, params.id);
	if (!found) elsewhere();
	const day = today();
	const [days, marks, offers, shared] = await Promise.all([
		on ? store.practiceOf(email) : [],
		store.marksOf(email, params.id).catch(() => []),
		offersFor(email, params.id).catch(() => []),
		store.shareOf(email, params.id).catch(() => null)
	]);
	const recording = library.piecesById.get(found!.piece.id)?.sheet?.recording;
	return {
		file: params.id,
		piece: { id: found!.piece.id, title: found!.piece.title, composer: found!.piece.composer },
		part: found!.part.label,
		elsewhere: partUrl(params.id, PDF, locals.access.viaLink),
		// Counted only with practice time on (/profil).
		counting: on,
		todaySeconds: days.find((entry) => entry.day === day)?.seconds ?? 0,
		recording: recording ? { url: recording, youtube: youtubeId(recording) } : null,
		marks: Object.fromEntries(marks.map((page) => [page.page, page.strokes])),
		offers,
		// When the member last offered their notes here to their section.
		sharedAt: shared?.at ?? null
	};
};
