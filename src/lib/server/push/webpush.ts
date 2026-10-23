import { base64url, fromBase64url } from '../auth/session.ts';

/**
 * Web Push with WebCrypto only (#157), no package: the message is encrypted for the device
 * (RFC 8291, aes128gcm) and the request signed with the app's VAPID key (RFC 8292), so push
 * services accept it and only the device can read it.
 */

export interface VapidKeys {
	/** Uncompressed P-256 public key, base64url (65 bytes). The browser subscribes with it. */
	publicKey: string;
	/** The private scalar d, base64url (32 bytes). */
	privateKey: string;
	/** Who runs the app, for push services that need to get in touch: "mailto:…" or "https://…". */
	subject: string;
}

export interface PushTarget {
	endpoint: string;
	p256dh: string;
	auth: string;
}

/** Sent: the push service took it. Gone: the device unsubscribed; forget it. */
export type PushOutcome = 'sent' | 'gone' | 'failed';

const encoder = new TextEncoder();
const RECORD_SIZE = 4096;

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
	const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}

async function hkdf(salt: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, bytes: number) {
	const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
	return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}

/** RFC 8291 key schedule; shared with the test, which decrypts with it. */
export async function contentKeys(
	ecdhSecret: Uint8Array<ArrayBuffer>,
	authSecret: Uint8Array<ArrayBuffer>,
	devicePublic: Uint8Array,
	serverPublic: Uint8Array,
	salt: Uint8Array<ArrayBuffer>
) {
	const ikm = await hkdf(authSecret, ecdhSecret, concat(encoder.encode('WebPush: info\0'), devicePublic, serverPublic), 32);
	return {
		key: await hkdf(salt, ikm, encoder.encode('Content-Encoding: aes128gcm\0'), 16),
		nonce: await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12)
	};
}

/** The request body for one device: header (salt, record size, server key) and one encrypted record. */
export async function encrypt(payload: string, target: Pick<PushTarget, 'p256dh' | 'auth'>): Promise<Uint8Array<ArrayBuffer>> {
	const devicePublic = fromBase64url(target.p256dh);
	const server = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
	const serverPublic = new Uint8Array(await crypto.subtle.exportKey('raw', server.publicKey));
	const device = await crypto.subtle.importKey('raw', devicePublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
	const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: device }, server.privateKey, 256));
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const { key, nonce } = await contentKeys(ecdhSecret, fromBase64url(target.auth), devicePublic, serverPublic, salt);
	const aes = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
	// 0x02 marks the last (and only) record; no padding.
	const record = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, concat(encoder.encode(payload), new Uint8Array([2]))));
	const size = new Uint8Array(4);
	new DataView(size.buffer).setUint32(0, RECORD_SIZE);
	return concat(salt, size, new Uint8Array([serverPublic.length]), serverPublic, record);
}

/** The VAPID header value: a JWT for the push service's origin, signed with ES256. */
export async function vapidAuthorization(endpoint: string, vapid: VapidKeys, now = Date.now()): Promise<string> {
	const publicKey = fromBase64url(vapid.publicKey);
	const jwk: JsonWebKey = {
		kty: 'EC',
		crv: 'P-256',
		d: vapid.privateKey,
		x: base64url(publicKey.slice(1, 33)),
		y: base64url(publicKey.slice(33, 65))
	};
	const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
	const part = (value: object) => base64url(encoder.encode(JSON.stringify(value)));
	const unsigned = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: vapid.subject })}`;
	// WebCrypto signs as r‖s, which is what JWS wants.
	const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, encoder.encode(unsigned));
	return `vapid t=${unsigned}.${base64url(signature)}, k=${vapid.publicKey}`;
}

export async function sendPush(target: PushTarget, payload: string, vapid: VapidKeys, fetcher: typeof fetch = fetch): Promise<PushOutcome> {
	try {
		const response = await fetcher(target.endpoint, {
			method: 'POST',
			headers: {
				authorization: await vapidAuthorization(target.endpoint, vapid),
				'content-encoding': 'aes128gcm',
				'content-type': 'application/octet-stream',
				// A reminder a day late is no use.
				ttl: String(24 * 3600),
				urgency: 'normal'
			},
			body: await encrypt(payload, target)
		});
		if (response.ok) return 'sent';
		if (response.status === 404 || response.status === 410) return 'gone';
		console.error(`Push to ${new URL(target.endpoint).host} answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
		return 'failed';
	} catch (cause) {
		console.error('Sending a push message failed:', cause);
		return 'failed';
	}
}

