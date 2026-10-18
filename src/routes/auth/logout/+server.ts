import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE } from '#lib/server/auth/index.ts';
import type { RequestHandler } from './$types';

// POST only, so a link or image elsewhere can't sign someone out.
export const POST: RequestHandler = ({ cookies }) => {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	redirect(303, '/anmelden');
};
