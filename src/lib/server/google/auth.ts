/**
 * Google service-account login without the googleapis package: sign a JWT with
 * WebCrypto and exchange it for an access token (OAuth 2.0 JWT bearer flow).
 */

export interface ServiceAccountKey {
	client_email: string;
	private_key: string;
	token_uri?: string;
}

export const SCOPES = [
	'https://www.googleapis.com/auth/drive.readonly',
	'https://www.googleapis.com/auth/calendar.readonly',
	'https://www.googleapis.com/auth/spreadsheets'
];

/** With DRIVE_WRITE the app may comment on and rename files; Drive's sharing still limits it to what the account can edit. */
export const WRITE_SCOPES = SCOPES.map((scope) =>
	scope.endsWith('/drive.readonly') ? 'https://www.googleapis.com/auth/drive' : scope
);

const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';
/** Renew a little before Google's expiry so in-flight requests don't fail. */
const EXPIRY_MARGIN_S = 120;

/**
 * Accepts the key file's JSON as is, or base64-encoded (which avoids quoting
 * trouble when pasting it into `.dev.vars` or `wrangler secret put`).
 */
export function parseServiceAccountKey(value: string): ServiceAccountKey {
	const text = value.trim();
	let key: unknown;
	try {
		key = JSON.parse(text.startsWith('{') ? text : new TextDecoder().decode(base64ToBytes(text)));
	} catch {
		throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is neither valid JSON nor base64-encoded JSON');
	}
	const { client_email, private_key } = (key ?? {}) as Partial<ServiceAccountKey>;
	if (typeof client_email !== 'string' || typeof private_key !== 'string') {
		throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
	}
	return key as ServiceAccountKey;
}

function base64url(data: ArrayBuffer | Uint8Array | string): string {
	const bytes =
		typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64ToBytes(base64: string): Uint8Array {
	const binary = atob(base64.replace(/\s+/g, ''));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

function pemToDer(pem: string): ArrayBuffer {
	const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '');
	return base64ToBytes(body).buffer as ArrayBuffer;
}

export async function createSignedJwt(
	key: ServiceAccountKey,
	scopes: string[],
	nowS = Math.floor(Date.now() / 1000)
): Promise<string> {
	const header = { alg: 'RS256', typ: 'JWT' };
	const claims = {
		iss: key.client_email,
		scope: scopes.join(' '),
		aud: key.token_uri ?? DEFAULT_TOKEN_URI,
		iat: nowS,
		exp: nowS + 3600
	};
	const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

	const cryptoKey = await crypto.subtle.importKey(
		'pkcs8',
		pemToDer(key.private_key),
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		cryptoKey,
		new TextEncoder().encode(unsigned)
	);
	return `${unsigned}.${base64url(signature)}`;
}

export interface TokenProvider {
	/** A valid access token, fetched or renewed when needed. */
	getToken(options?: { forceRefresh?: boolean }): Promise<string>;
}

/**
 * Tokens are cached in memory for the lifetime of the Worker isolate, so most
 * requests need no token round trip at all.
 */
export function createTokenProvider(
	key: ServiceAccountKey,
	scopes: string[] = SCOPES,
	fetchImpl: typeof fetch = fetch
): TokenProvider {
	let cached: { token: string; expiresAtS: number } | null = null;
	let pending: Promise<string> | null = null;

	async function fetchToken(): Promise<string> {
		const nowS = Math.floor(Date.now() / 1000);
		const assertion = await createSignedJwt(key, scopes, nowS);
		const response = await fetchImpl(key.token_uri ?? DEFAULT_TOKEN_URI, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				assertion
			})
		});
		const body = (await response.json().catch(() => ({}))) as {
			access_token?: string;
			expires_in?: number;
			error_description?: string;
			error?: string;
		};
		if (!response.ok || !body.access_token) {
			throw new Error(
				`Google login failed (${response.status}): ${body.error_description ?? body.error ?? 'no token'}`
			);
		}
		cached = { token: body.access_token, expiresAtS: nowS + (body.expires_in ?? 3600) };
		return body.access_token;
	}

	return {
		async getToken({ forceRefresh = false } = {}) {
			const nowS = Math.floor(Date.now() / 1000);
			if (!forceRefresh && cached && cached.expiresAtS - EXPIRY_MARGIN_S > nowS) {
				return cached.token;
			}
			// Share one token request between concurrent callers.
			pending ??= fetchToken().finally(() => (pending = null));
			return pending;
		}
	};
}
