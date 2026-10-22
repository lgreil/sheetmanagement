import { error, redirect } from '@sveltejs/kit';
import { instrumentOverrides } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { DEMO_ROLE_COOKIE, isPublicPath } from '#lib/server/auth/index.ts';
import { features, isDemo, orchestra } from '#lib/server/env.ts';
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

	const on = features();
	// Open work on the workspace tabs (#139), only on a workspace's pages and for those who see it.
	const rights = [...access.rights];
	const counts = workspaceOf(navGroups({ auth, rights, features: on }), url.pathname) ? countsByPage(await openWork(locals)) : {};

	const { name, shortName, logo, colours, style, look } = orchestra();
	return {
		orchestraName: name,
		orchestraShortName: shortName,
		logo,
		brand: { colour: colours.brand, style, look },
		features: on,
		instruments: instrumentOverrides(),
		auth,
		user: access.user,
		rights,
		counts,
		demo: isDemo() ? { role: cookies.get(DEMO_ROLE_COOKIE) === 'mitglied' ? ('mitglied' as const) : ('verwaltung' as const) } : null
	};
};
