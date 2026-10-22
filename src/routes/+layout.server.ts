import { error, redirect } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { DEMO_ROLE_COOKIE, isPublicPath } from '#lib/server/auth/index.ts';
import { appEnv, isDemo, orchestraLogo } from '#lib/server/env.ts';
import { countsByPage, openWork } from '#lib/server/todo.ts';
import { navGroups, workspaceOf } from '#lib/nav.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	const { access, auth } = locals;
	if (auth === 'on' && !isPublicPath(url.pathname)) {
		if (!access.user) redirect(303, `/anmelden?weiter=${encodeURIComponent(url.pathname + url.search)}`);
		if (access.unavailable) error(503, t.error.unavailable);
		if (!access.member) redirect(303, '/zugang');
	}

	// Open work on the workspace tabs (#139), only on a workspace's pages and for those who see it.
	const rights = [...access.rights];
	const counts = workspaceOf(navGroups({ auth, rights }), url.pathname) ? countsByPage(await openWork(locals)) : {};

	const env = appEnv();
	const name = env.ORCHESTRA_NAME?.trim();
	return {
		orchestraName: name || config.name,
		// A custom name without a custom short name shouldn't fall back to the preset's short name.
		orchestraShortName: env.ORCHESTRA_SHORT_NAME?.trim() || name || config.shortName,
		logo: orchestraLogo(),
		auth,
		user: access.user,
		rights,
		counts,
		demo: isDemo() ? { role: cookies.get(DEMO_ROLE_COOKIE) === 'mitglied' ? ('mitglied' as const) : ('verwaltung' as const) } : null
	};
};
