import { error } from '@sveltejs/kit';
import { normalizeEmail } from '#lib/access/access.ts';
import { t } from '#lib/i18n/index.ts';
import { beatSeconds } from '#lib/practice/practice.ts';
import { getCatalog } from '#lib/server/catalog.ts';
import { getStore } from '#lib/server/db/index.ts';
import { ownPart, recordPractice } from '#lib/server/practice.ts';
import { getAccessList, getMusicConfig } from '#lib/server/repertoire.ts';
import type { RequestHandler } from './$types';

/** At most this many reports per member and minute; the viewer sends one every 30 seconds. */
const PER_MINUTE = 3;

/**
 * Practice time from the practice viewer (/ueben/<file>): `{ file, seconds }` every 30 seconds
 * while the part is open, visible and in use. Counted only for the signed-in member, only
 * when they turned it on, and only for a part of their own instrument.
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.access.user;
	if (locals.auth !== 'on' || !user || !locals.access.member) error(403, t.messages.signInFirst);
	const body = (await request.json().catch(() => null)) as { file?: unknown; seconds?: unknown } | null;
	const seconds = beatSeconds(body?.seconds);
	if (typeof body?.file !== 'string' || !seconds) return new Response(null, { status: 204 });

	const email = normalizeEmail(user.email);
	const [catalog, access, music] = await Promise.all([getCatalog(), getAccessList(), getMusicConfig()]);
	if (!catalog.ok) error(503, t.messages.archiveUnavailable);
	const member = access?.membersByEmail.get(email);
	if (!member || !ownPart(catalog.catalog, member.instrument ?? '', music, body.file)) error(404, t.messages.noFile);
	if ((await getStore().hit(`practice:${email}`, 1)) > PER_MINUTE) error(429);
	const counted = await recordPractice(email, seconds);
	return new Response(null, { status: counted ? 204 : 409 });
};
