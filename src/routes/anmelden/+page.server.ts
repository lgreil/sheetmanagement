import { redirect } from '@sveltejs/kit';
import { authConfig } from '#lib/server/auth/index.ts';
import { safeReturnPath } from '#lib/server/auth/redirect.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	const auth = authConfig();
	if (auth.mode === 'off') redirect(303, '/');
	const returnTo = safeReturnPath(url.searchParams.get('weiter'));
	if (locals.access.member) redirect(303, returnTo);
	return {
		returnTo,
		error: url.searchParams.get('fehler'),
		// Setting names only, no values: safe to show, and they help whoever sets up the app.
		problems: auth.problems.filter((problem) => !problem.startsWith('BOOTSTRAP_ADMINS'))
	};
};
