import { fromBase64url } from './session.ts';

/**
 * "Sign in with Google" (OpenID Connect, authorization code flow) with plain fetch.
 * Only the basic scopes are requested, which need no verification by Google.
 */

export const GOOGLE_SIGN_IN_ORIGIN = 'https://accounts.google.com';
const AUTHORIZE_URL = `${GOOGLE_SIGN_IN_ORIGIN}/o/oauth2/v2/auth`;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export interface OAuthClient {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}

export function authorizationUrl(client: Pick<OAuthClient, 'clientId' | 'redirectUri'>, state: string): string {
	const url = new URL(AUTHORIZE_URL);
	url.search = new URLSearchParams({
		client_id: client.clientId,
		redirect_uri: client.redirectUri,
		response_type: 'code',
		scope: 'openid email profile',
		state,
		// Lets people with several Google accounts pick the right one.
		prompt: 'select_account'
	}).toString();
	return url.toString();
}

export interface GoogleUser {
	email: string;
	name: string;
}

export class SignInError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SignInError';
	}
}

/** Exchanges the code from the redirect for the user's verified identity. */
export async function signIn(
	client: OAuthClient,
	code: string,
	fetchImpl: typeof fetch = (input, init) => fetch(input, init),
	now = Date.now()
): Promise<GoogleUser> {
	const response = await fetchImpl(TOKEN_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: client.clientId,
			client_secret: client.clientSecret,
			redirect_uri: client.redirectUri,
			grant_type: 'authorization_code'
		}),
		signal: AbortSignal.timeout(10_000)
	});
	const body = (await response.json().catch(() => ({}))) as { id_token?: string; error?: string; error_description?: string };
	if (!response.ok || !body.id_token) {
		throw new SignInError(body.error_description ?? body.error ?? `Token request failed (${response.status})`);
	}
	return readIdToken(body.id_token, client.clientId, now);
}

/**
 * Reads the ID token's claims. Its signature isn't checked: the token comes straight
 * from Google's token endpoint over TLS, in exchange for our client secret, which
 * OpenID Connect allows (Core 1.0, §3.1.3.7). The claims are still checked.
 */
export function readIdToken(idToken: string, clientId: string, now = Date.now()): GoogleUser {
	let claims: Record<string, unknown>;
	try {
		claims = JSON.parse(new TextDecoder().decode(fromBase64url(idToken.split('.')[1] ?? '')));
	} catch {
		throw new SignInError('Unreadable ID token');
	}
	if (!ISSUERS.includes(String(claims.iss))) throw new SignInError('ID token from an unexpected issuer');
	if (claims.aud !== clientId) throw new SignInError('ID token for another client');
	if (typeof claims.exp !== 'number' || claims.exp * 1000 < now) throw new SignInError('ID token expired');
	if (typeof claims.email !== 'string' || claims.email_verified !== true) {
		throw new SignInError('Google account without a verified email address');
	}
	const email = claims.email.toLowerCase();
	return {
		email,
		name: typeof claims.name === 'string' && claims.name ? claims.name : email
	};
}
