import type { Handle } from '@sveltejs/kit/hooks';
import { accessFromCookies, authConfig, isPublicPath } from '#lib/server/auth/index.ts';

/** Sent with every response: no framing (clickjacking on the admin forms), no MIME sniffing. */
const SECURITY_HEADERS = {
	'content-security-policy': "frame-ancestors 'none'",
	'x-frame-options': 'DENY',
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin'
};

export const handle: Handle = async ({ event, resolve }) => {
	const auth = authConfig();
	event.locals.auth = auth.mode;
	event.locals.access = await accessFromCookies(event.cookies, auth);

	// Pages redirect to sign-in in the root layout's load. That doesn't cover form
	// actions and endpoints, so anything that isn't a plain read is checked here.
	const write = event.request.method !== 'GET' && event.request.method !== 'HEAD';
	if (auth.mode === 'on' && write && !isPublicPath(event.url.pathname) && !event.locals.access.member) {
		return new Response('Bitte zuerst anmelden.', {
			status: 403,
			headers: { 'content-type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS }
		});
	}
	const response = await resolve(event);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		// Redirects and some responses have immutable headers; those carry no page anyway.
		try {
			if (!response.headers.has(name)) response.headers.set(name, value);
		} catch {
			break;
		}
	}
	return response;
};
