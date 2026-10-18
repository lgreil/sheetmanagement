import { error, redirect } from '@sveltejs/kit';
import { authConfig, SESSION_COOKIE, STATE_COOKIE } from '#lib/server/auth/index.ts';
import { signIn, SignInError } from '#lib/server/auth/google.ts';
import { safeReturnPath } from '#lib/server/auth/redirect.ts';
import { SESSION_DAYS, signSession } from '#lib/server/auth/session.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const auth = authConfig();
	if (auth.mode === 'off') error(404, 'Die Anmeldung ist nicht eingerichtet.');

	let expected: { state?: string; returnTo?: string } = {};
	try {
		expected = JSON.parse(cookies.get(STATE_COOKIE) ?? '{}');
	} catch {
		// A broken cookie is treated like a missing one.
	}
	cookies.delete(STATE_COOKIE, { path: '/auth' });

	// Cancelled on Google's page, or the link was opened in another browser.
	const code = url.searchParams.get('code');
	if (url.searchParams.get('error') || !code) redirect(303, '/anmelden?fehler=abgebrochen');
	if (!expected.state || expected.state !== url.searchParams.get('state')) redirect(303, '/anmelden?fehler=abgelaufen');

	let user;
	try {
		user = await signIn({ clientId: auth.clientId, clientSecret: auth.clientSecret, redirectUri: `${url.origin}/auth/callback` }, code);
	} catch (cause) {
		console.error('Google sign-in failed:', cause);
		redirect(303, `/anmelden?fehler=${cause instanceof SignInError ? 'konto' : 'google'}`);
	}

	const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86_400;
	cookies.set(SESSION_COOKIE, await signSession({ ...user, exp }, auth.sessionSecret), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: SESSION_DAYS * 86_400
	});
	redirect(303, safeReturnPath(expected.returnTo));
};
