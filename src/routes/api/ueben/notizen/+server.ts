import { error } from '@sveltejs/kit';
import { normalizeEmail } from '#lib/access/access.ts';
import { t } from '#lib/i18n/index.ts';
import { parseStrokes } from '#lib/practice/marks.ts';
import { getCatalog } from '#lib/server/catalog.ts';
import { getStore } from '#lib/server/db/index.ts';
import { ownPart } from '#lib/server/practice.ts';
import { getAccessList, getMusicConfig } from '#lib/server/repertoire.ts';
import type { RequestHandler } from './$types';

/** Saves per member and minute; the viewer saves a page a moment after the pen stops. */
const PER_MINUTE = 30;

/**
 * The member's own marks on one page of a part, from the practice viewer: `{ file, page,
 * strokes }`, replacing what was there; no strokes forget the page. Only for the signed-in
 * member and a part of their own instrument; nobody else ever reads them.
 */
export const PUT: RequestHandler = async ({ locals, request }) => {
	const user = locals.access.user;
	if (locals.auth !== 'on' || !user || !locals.access.member) error(403, t.messages.signInFirst);
	const body = (await request.json().catch(() => null)) as { file?: unknown; page?: unknown; strokes?: unknown } | null;
	const strokes = parseStrokes(body?.strokes);
	const page = body?.page;
	if (typeof body?.file !== 'string' || typeof page !== 'number' || !Number.isInteger(page) || page < 1 || page > 500 || !strokes) error(400);

	const email = normalizeEmail(user.email);
	const [catalog, access, music] = await Promise.all([getCatalog(), getAccessList(), getMusicConfig()]);
	if (!catalog.ok) error(503, t.messages.archiveUnavailable);
	const member = access?.membersByEmail.get(email);
	if (!member || !ownPart(catalog.catalog, member.instrument ?? '', music, body.file)) error(404, t.messages.noFile);
	const store = getStore();
	if ((await store.hit(`marks:${email}`, 1)) > PER_MINUTE) error(429);
	await store.saveMarks(email, body.file, page, strokes);
	return new Response(null, { status: 204 });
};
