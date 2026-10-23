import { fail } from '@sveltejs/kit';
import { normalizeEmail } from '#lib/access/access.ts';
import { ANSWERS, type Answer } from '#lib/signups/signups.ts';
import { authConfig } from '#lib/server/auth/index.ts';
import { readAnswerToken } from '#lib/server/auth/mail-links.ts';
import { isOn } from '#lib/server/env.ts';
import { getLibrary } from '#lib/server/library.ts';
import { getAccessList, getSignups } from '#lib/server/repertoire.ts';
import { SheetLayoutError } from '#lib/server/sheet-writes.ts';
import { saveSignup } from '#lib/server/signups.ts';
import type { Actions, PageServerLoad } from './$types';

/**
 * Answering a sign-up from a reminder email (#123), without signing in: the link is signed
 * for one member and one event. Opening it only shows the buttons, with the one from the
 * email picked; the answer is saved by a POST, so mail scanners that open links answer nothing.
 */
async function find(token: string) {
	const auth = authConfig();
	if (auth.mode === 'off' || !isOn('signups')) return null;
	const link = await readAnswerToken(token, auth.sessionSecret);
	if (!link) return null;
	const [library, access] = await Promise.all([getLibrary(), getAccessList()]);
	const event = library.schedule.ok ? library.schedule.byId.get(link.eventId) : undefined;
	const member = access?.membersByEmail.get(link.email);
	if (!event || event.past || !member) return null;
	return {
		event: { id: event.id, label: `${event.displayTitle} · ${event.date.long}`, title: event.displayTitle, when: event.date.long },
		user: { email: member.email, name: member.name || member.email }
	};
}

const isAnswer = (value: unknown): value is Answer => ANSWERS.includes(value as Answer);

export const load: PageServerLoad = async ({ params, url }) => {
	const found = await find(params.token);
	if (!found) return { found: null, current: null, picked: null };
	const signups = await getSignups().catch(() => null);
	const mine = signups?.byEvent.get(found.event.id)?.find((signup) => normalizeEmail(signup.email) === found.user.email);
	const picked = url.searchParams.get('a');
	return {
		found: { title: found.event.title, when: found.event.when, id: found.event.id, firstName: found.user.name.split(/\s+/)[0] },
		current: mine?.answer ?? null,
		picked: isAnswer(picked) ? picked : null
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const found = await find(params.token);
		if (!found) return fail(410, { invalid: true });
		const answer = (await request.formData()).get('answer');
		if (!isAnswer(answer)) return fail(400, { failed: true });
		try {
			await saveSignup(found.event, found.user, { answer });
			return { saved: answer };
		} catch (cause) {
			if (!(cause instanceof SheetLayoutError)) console.error('Saving a sign-up from an email failed:', cause);
			return fail(503, { failed: true });
		}
	}
};
