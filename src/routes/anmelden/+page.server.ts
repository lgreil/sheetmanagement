import { fail, redirect } from '@sveltejs/kit';
import { authConfig } from '#lib/server/auth/index.ts';
import { safeReturnPath } from '#lib/server/auth/redirect.ts';
import { runInBackground } from '#lib/server/env.ts';
import { mailReady } from '#lib/server/mail/index.ts';
import { looksLikeEmail, requestSignInLink } from '#lib/server/mail/sign-in.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const auth = authConfig();
	if (auth.mode === 'off') redirect(303, '/');
	const returnTo = safeReturnPath(url.searchParams.get('weiter'));
	if (locals.access.member) redirect(303, returnTo);
	return {
		returnTo,
		error: url.searchParams.get('fehler'),
		// Setting names only, no values: safe to show, and they help whoever sets up the app.
		problems: auth.problems.filter((problem) => !problem.startsWith('BOOTSTRAP_ADMINS')),
		// A sign-in link by email (#123), once an account for sending is connected.
		mail: !auth.problems.length && (await mailReady())
	};
};

export const actions: Actions = {
	email: async ({ request, url, getClientAddress }) => {
		const auth = authConfig();
		if (auth.mode === 'off' || auth.problems.length || !(await mailReady())) return fail(404, { mailError: 'failed' as const });
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		if (!looksLikeEmail(email) || email.length > 200) return fail(400, { mailError: 'invalid' as const, email });
		try {
			const result = await requestSignInLink(email, getClientAddress(), url.origin, safeReturnPath(String(data.get('weiter') ?? '')));
			if (result.state === 'limited') return fail(429, { mailError: 'limited' as const, email });
			// Sent after the answer: a member's mail takes as long to answer as anyone else's.
			if (result.work) runInBackground(result.work.catch((cause: unknown) => console.error('Sign-in mail failed:', cause)));
			return { mailSent: email };
		} catch (cause) {
			console.error('Asking for a sign-in link failed:', cause);
			return fail(503, { mailError: 'failed' as const, email });
		}
	}
};
