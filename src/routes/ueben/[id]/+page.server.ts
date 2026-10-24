import { error, redirect } from '@sveltejs/kit';
import { normalizeEmail } from '#lib/access/access.ts';
import { t } from '#lib/i18n/index.ts';
import { partUrl, getCatalog } from '#lib/server/catalog.ts';
import { getStore } from '#lib/server/db/index.ts';
import { today } from '#lib/server/members.ts';
import { ownPart } from '#lib/server/practice.ts';
import { getAccessList, getMusicConfig } from '#lib/server/repertoire.ts';
import type { PageServerLoad } from './$types';

const PDF = 'application/pdf';

/**
 * The practice viewer: a part of the member's own instrument, drawn in the app, so the time it
 * is open can count as practice time. Anything else (practice time off, another instrument's
 * part, sign-in off) opens where "Meine Noten" would open it.
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	const elsewhere = () => redirect(303, partUrl(params.id, PDF, locals.access.viaLink));
	const user = locals.access.user;
	if (locals.auth !== 'on' || !user || !locals.access.member) elsewhere();
	const email = normalizeEmail(user!.email);
	const store = getStore();
	const [catalog, access, music, on] = await Promise.all([getCatalog(), getAccessList(), getMusicConfig(), store.practiceOn(email).catch(() => false)]);
	if (!catalog.ok) error(503, t.messages.archiveUnavailable);
	const member = access?.membersByEmail.get(email);
	const found = member && ownPart(catalog.catalog, member.instrument ?? '', music, params.id);
	if (!on || !found) elsewhere();
	const day = today();
	const todaySeconds = (await store.practiceOf(email)).find((entry) => entry.day === day)?.seconds ?? 0;
	return {
		file: params.id,
		piece: { id: found!.piece.id, title: found!.piece.title, composer: found!.piece.composer },
		part: found!.part.label,
		elsewhere: partUrl(params.id, PDF, locals.access.viaLink),
		todaySeconds
	};
};
