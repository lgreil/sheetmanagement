import type { Handle } from '@sveltejs/kit/hooks';
import { accessFromCookies, authConfig, isPublicPath } from '#lib/server/auth/index.ts';

export const handle: Handle = async ({ event, resolve }) => {
	const auth = authConfig();
	event.locals.auth = auth.mode;
	event.locals.access = await accessFromCookies(event.cookies, auth);

	// Pages redirect to sign-in in the root layout's load. That doesn't cover form
	// actions and endpoints, so anything that isn't a plain read is checked here.
	const write = event.request.method !== 'GET' && event.request.method !== 'HEAD';
	if (auth.mode === 'on' && write && !isPublicPath(event.url.pathname) && !event.locals.access.member) {
		return new Response('Bitte zuerst anmelden.', { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8' } });
	}
	return resolve(event);
};
