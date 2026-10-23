import { error, redirect } from '@sveltejs/kit';
import { DEMO_ROLE_COOKIE } from '#lib/server/auth/index.ts';
import { safeReturnPath } from '#lib/server/auth/redirect.ts';
import { resetDemo } from '#lib/server/demo/backend.ts';
import { DEMO_ADMIN, DEMO_MEMBER } from '#lib/server/demo/data.ts';
import { getStore } from '#lib/server/db/index.ts';
import { isDemo } from '#lib/server/env.ts';
import { resetDemoPolls } from '#lib/server/polls.ts';
import { getArchiveIndex } from '#lib/server/services.ts';
import { refreshAfterWrite } from '#lib/server/sheet-writes.ts';
import type { RequestHandler } from './$types';

/** The demo banner's buttons: switch the demo user, or go back to the sample data. Demo mode only. */
export const POST: RequestHandler = async ({ request, cookies, url }) => {
	if (!isDemo()) error(404, 'Not found');
	const data = await request.formData();
	const role = data.get('rolle');
	if (role === 'mitglied' || role === 'verwaltung') {
		cookies.set(DEMO_ROLE_COOKIE, role, { path: '/', httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:' });
	}
	if (data.has('zuruecksetzen')) {
		resetDemo();
		resetDemoPolls();
		// Both demo users are new again: the tour is offered once more.
		await Promise.all([DEMO_ADMIN, DEMO_MEMBER].map((user) => getStore().setTour(user.email, null)));
		await refreshAfterWrite();
		// The Drive changes too (renamed files, programme shortcuts): read it again from the sample data.
		await getArchiveIndex({ force: true });
	}
	const back = safeReturnPath(String(data.get('weiter') ?? '/'));
	// A member may not open editors and admin pages; after switching, they'd only see an error.
	const forAdmins = /\/(programm|probenplan|bearbeiten)$|^\/(admin|einstellungen|setup|status|meldungen|namen|stuecke\/angaben)/;
	redirect(303, role === 'mitglied' && forAdmins.test(back.split('?')[0]) ? '/' : back);
};
