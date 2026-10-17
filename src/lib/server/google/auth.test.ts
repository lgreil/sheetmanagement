import { describe, expect, it, vi } from 'vitest';
import { createSignedJwt, createTokenProvider, parseServiceAccountKey, type ServiceAccountKey } from './auth.ts';

async function testKey(): Promise<{ key: ServiceAccountKey; publicKey: CryptoKey }> {
	const pair = (await crypto.subtle.generateKey(
		{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
		true,
		['sign', 'verify']
	)) as CryptoKeyPair;
	const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
	const base64 = btoa(String.fromCharCode(...der)).replace(/(.{64})/g, '$1\n');
	return {
		key: {
			client_email: 'reader@example-project.iam.gserviceaccount.com',
			private_key: `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----\n`
		},
		publicKey: pair.publicKey
	};
}

const decode = (part: string) =>
	JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));

describe('createSignedJwt', () => {
	it('creates a JWT with the right claims and a valid RS256 signature', async () => {
		const { key, publicKey } = await testKey();
		const jwt = await createSignedJwt(key, ['scope-a', 'scope-b'], 1_000_000);
		const [header, claims, signature] = jwt.split('.');

		expect(decode(header)).toEqual({ alg: 'RS256', typ: 'JWT' });
		expect(decode(claims)).toEqual({
			iss: key.client_email,
			scope: 'scope-a scope-b',
			aud: 'https://oauth2.googleapis.com/token',
			iat: 1_000_000,
			exp: 1_003_600
		});

		const sig = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
		const valid = await crypto.subtle.verify(
			'RSASSA-PKCS1-v1_5',
			publicKey,
			sig,
			new TextEncoder().encode(`${header}.${claims}`)
		);
		expect(valid).toBe(true);
	});
});

describe('createTokenProvider', () => {
	it('fetches a token once and reuses it until shortly before expiry', async () => {
		const { key } = await testKey();
		const fetchMock = vi.fn(async () => Response.json({ access_token: 'token-1', expires_in: 3600 }));
		const provider = createTokenProvider(key, ['scope'], fetchMock as unknown as typeof fetch);

		const [a, b] = await Promise.all([provider.getToken(), provider.getToken()]);
		expect(a).toBe('token-1');
		expect(b).toBe('token-1');
		await provider.getToken();
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await provider.getToken({ forceRefresh: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('reports Google errors clearly', async () => {
		const { key } = await testKey();
		const fetchMock = vi.fn(async () =>
			Response.json({ error: 'invalid_grant', error_description: 'Invalid JWT Signature.' }, { status: 400 })
		);
		const provider = createTokenProvider(key, ['scope'], fetchMock as unknown as typeof fetch);
		await expect(provider.getToken()).rejects.toThrow('Google login failed (400): Invalid JWT Signature.');
	});
});

describe('parseServiceAccountKey', () => {
	it('accepts plain or base64-encoded JSON', () => {
		const json = '{"client_email":"a@b.iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\\nAA==\\n-----END PRIVATE KEY-----\\n"}';
		expect(parseServiceAccountKey(json).client_email).toBe('a@b.iam.gserviceaccount.com');
		expect(parseServiceAccountKey(`  ${btoa(json)}\n`).private_key).toContain('\nAA==\n');
	});

	it('rejects invalid or incomplete keys', () => {
		expect(() => parseServiceAccountKey('not json')).toThrow('neither valid JSON nor base64');
		expect(() => parseServiceAccountKey('{"client_email":"x"}')).toThrow('missing client_email or private_key');
	});
});
