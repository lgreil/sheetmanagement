import { redirect } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { isPublicPath } from '#lib/server/auth/index.ts';
import { appEnv } from '#lib/server/env.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	const { access, auth } = locals;
	if (auth === 'on' && !isPublicPath(url.pathname)) {
		if (!access.user) redirect(303, `/anmelden?weiter=${encodeURIComponent(url.pathname + url.search)}`);
		if (!access.member) redirect(303, '/zugang');
	}

	const env = appEnv();
	const name = env.ORCHESTRA_NAME?.trim();
	return {
		orchestraName: name || config.name,
		// A custom name without a custom short name shouldn't fall back to the preset's short name.
		orchestraShortName: env.ORCHESTRA_SHORT_NAME?.trim() || name || config.shortName,
		auth,
		user: access.user,
		rights: [...access.rights]
	};
};
