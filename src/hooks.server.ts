import type { Handle } from '@sveltejs/kit/hooks';
import { resolveAccess } from '#lib/access/access.ts';
import { t } from '#lib/i18n/index.ts';
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
	// The health check must answer even while Google doesn't.
	event.locals.access =
		event.url.pathname === '/api/health' ? resolveAccess(null, null, []) : await accessFromCookies(event.cookies, auth);

	// Pages redirect to sign-in in the root layout's load. That doesn't cover form
	// actions and endpoints, so anything that isn't a plain read is checked here.
	const write = event.request.method !== 'GET' && event.request.method !== 'HEAD';
	if (auth.mode === 'on' && write && !isPublicPath(event.url.pathname) && !event.locals.access.member) {
		const unavailable = event.locals.access.unavailable;
		return new Response(unavailable ? t.error.unavailable : 'Bitte zuerst anmelden.', {
			status: unavailable ? 503 : 403,
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
