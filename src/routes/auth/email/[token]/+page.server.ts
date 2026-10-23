import { fail, redirect } from '@sveltejs/kit';
import { authConfig, SESSION_COOKIE } from '#lib/server/auth/index.ts';
import { readSignInLink } from '#lib/server/auth/mail-links.ts';
import { safeReturnPath } from '#lib/server/auth/redirect.ts';
import { SESSION_DAYS, signSession } from '#lib/server/auth/session.ts';
import { getAccessList } from '#lib/server/repertoire.ts';
import type { Actions, PageServerLoad } from './$types';

/**
 * A sign-in link from an email (#123). Like an access link, opening it only shows a button
 * and signing in is a POST, so mail scanners that open links don't use it up or sign in.
 * The session is an ordinary one: what the member may do is looked up in the sheet as always.
 */
async function signInAs(token: string) {
	const auth = authConfig();
	if (auth.mode === 'off' || !auth.sessionSecret) return { auth, email: null, name: '' };
	const email = await readSignInLink(token, auth.sessionSecret);
	if (!email) return { auth, email: null, name: '' };
	const member = (await getAccessList())?.membersByEmail.get(email);
	if (!member && !auth.bootstrapAdmins.includes(email)) return { auth, email: null, name: '' };
	return { auth, email, name: member?.name || email };
}

export const load: PageServerLoad = async ({ params }) => {
	const { auth, email } = await signInAs(params.token);
	if (auth.mode === 'off') redirect(303, '/');
	return { email };
};

export const actions: Actions = {
	default: async ({ params, cookies, url }) => {
		const { auth, email, name } = await signInAs(params.token);
		if (auth.mode === 'off') redirect(303, '/');
		if (!email) return fail(410, { invalid: true });
		const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86_400;
		cookies.set(SESSION_COOKIE, await signSession({ email, name, exp }, auth.sessionSecret), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: SESSION_DAYS * 86_400
		});
		redirect(303, safeReturnPath(url.searchParams.get('weiter')));
	}
};
