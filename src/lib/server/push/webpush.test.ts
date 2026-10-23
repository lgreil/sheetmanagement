import { describe, expect, it, vi } from 'vitest';
import { base64url, fromBase64url } from '../auth/session.ts';
import { contentKeys, encrypt, sendPush, vapidAuthorization, type VapidKeys } from './webpush.ts';

/** A browser's side: its key pair and auth secret, as a push subscription carries them. */
async function device() {
	const pair = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
	const auth = crypto.getRandomValues(new Uint8Array(16));
	const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
	return { pair, target: { endpoint: 'https://push.example/send/abc', p256dh: base64url(publicKey), auth: base64url(auth) } };
}

/** What the browser does with the body (RFC 8291): read the header, derive the keys, decrypt. */
async function decrypt(body: Uint8Array<ArrayBuffer>, pair: CryptoKeyPair, target: { p256dh: string; auth: string }) {
	const salt = body.slice(0, 16);
	const recordSize = new DataView(body.buffer).getUint32(16);
	const keyLength = body[20];
	const serverPublic = body.slice(21, 21 + keyLength);
	const server = await crypto.subtle.importKey('raw', serverPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
	const secret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: server }, pair.privateKey, 256));
	const { key, nonce } = await contentKeys(secret, fromBase64url(target.auth), fromBase64url(target.p256dh), serverPublic, salt);
	const aes = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
	const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, aes, body.slice(21 + keyLength)));
	return { recordSize, last: plain.at(-1), text: new TextDecoder().decode(plain.slice(0, -1)) };
}

async function vapid(): Promise<VapidKeys> {
	const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])) as CryptoKeyPair;
	return {
		publicKey: base64url(await crypto.subtle.exportKey('raw', pair.publicKey)),
		privateKey: (await crypto.subtle.exportKey('jwk', pair.privateKey)).d!,
		subject: 'mailto:admin@example.org'
	};
}

describe('encrypt', () => {
	it('can only be read by the device it was made for', async () => {
		const { pair, target } = await device();
		const message = JSON.stringify({ title: 'Probe am Freitag', body: 'Kommst du? 🎻' });
		const body = await encrypt(message, target);
		expect(await decrypt(body, pair, target)).toEqual({ recordSize: 4096, last: 2, text: message });

		const other = await device();
		await expect(decrypt(body, other.pair, other.target)).rejects.toThrow();
	});
});

describe('vapidAuthorization', () => {
	it('signs a token for the push service with the app key', async () => {
		const keys = await vapid();
		const header = await vapidAuthorization('https://push.example/send/abc', keys, Date.UTC(2026, 9, 23));
		const [, token, key] = header.match(/^vapid t=([^,]+), k=(.+)$/)!;
		expect(key).toBe(keys.publicKey);
		const [head, claims, signature] = token.split('.');
		expect(JSON.parse(new TextDecoder().decode(fromBase64url(claims)))).toEqual({
			aud: 'https://push.example',
			exp: Date.UTC(2026, 9, 23) / 1000 + 12 * 3600,
			sub: 'mailto:admin@example.org'
		});
		const publicKey = await crypto.subtle.importKey('raw', fromBase64url(keys.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
		const valid = await crypto.subtle.verify(
			{ name: 'ECDSA', hash: 'SHA-256' },
			publicKey,
			fromBase64url(signature),
			new TextEncoder().encode(`${head}.${claims}`)
		);
		expect(valid).toBe(true);
	});
});

describe('sendPush', () => {
	it('tells a delivered message from a device that is gone', async () => {
		const { target } = await device();
		const keys = await vapid();
		const answer = (status: number) => vi.fn(async () => new Response('', { status }));
		expect(await sendPush(target, 'hi', keys, answer(201))).toBe('sent');
		expect(await sendPush(target, 'hi', keys, answer(410))).toBe('gone');
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(await sendPush(target, 'hi', keys, answer(500))).toBe('failed');
	});
});
