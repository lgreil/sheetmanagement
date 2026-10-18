import { error, redirect } from '@sveltejs/kit';
import { authConfig, STATE_COOKIE } from '#lib/server/auth/index.ts';
import { authorizationUrl, GOOGLE_SIGN_IN_ORIGIN } from '#lib/server/auth/google.ts';
import { safeReturnPath } from '#lib/server/auth/redirect.ts';
import { randomToken } from '#lib/server/auth/session.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, cookies }) => {
	const auth = authConfig();
	if (auth.mode === 'off') error(404, 'Die Anmeldung ist nicht eingerichtet.');
	if (auth.problems.length) error(503, auth.problems.join(' '));

	// The state ties Google's answer to this browser (CSRF protection for the callback).
	const state = randomToken();
	const returnTo = safeReturnPath(url.searchParams.get('weiter'));
	cookies.set(STATE_COOKIE, JSON.stringify({ state, returnTo }), {
		path: '/auth',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 10 * 60
	});
	redirect(303, authorizationUrl({ clientId: auth.clientId, redirectUri: `${url.origin}/auth/callback` }, state), {
		// The only external address this app sends anyone to.
		external: [GOOGLE_SIGN_IN_ORIGIN]
	});
};
