import { describe, expect, it } from 'vitest';
import { parseLinkVersion } from '#lib/access/access.ts';
import { linkToken, linkValid, nextLinkVersion, readLinkToken, revokedLinkVersion } from './links.ts';
import { signSession, signToken, verifySession, verifyToken } from './session.ts';

const SECRET = 'a'.repeat(32);

describe('access link tokens', () => {
	it('round-trip the email and version', async () => {
		const token = await linkToken('Anna@Example.org', 3, SECRET);
		expect(await readLinkToken(token, SECRET)).toEqual({ email: 'anna@example.org', version: 3 });
	});

	it('reject tampering and another secret', async () => {
		const token = await linkToken('anna@example.org', 3, SECRET);
		const [payload, signature] = token.split('.');
		const forged = btoa(JSON.stringify({ e: 'admin@example.org', v: 3 })).replace(/=+$/, '');
		expect(await readLinkToken(`${forged}.${signature}`, SECRET)).toBeNull();
		expect(await readLinkToken(`${payload}.${signature}x`, SECRET)).toBeNull();
		expect(await readLinkToken(token, 'b'.repeat(32))).toBeNull();
		expect(await readLinkToken('', SECRET)).toBeNull();
	});

	it('are never accepted as a session, nor a session as a link', async () => {
		const token = await linkToken('anna@example.org', 3, SECRET);
		expect(await verifySession(token, SECRET)).toBeNull();
		const session = await signSession({ email: 'anna@example.org', name: 'Anna', exp: 9_999_999_999 }, SECRET);
		expect(await readLinkToken(session, SECRET)).toBeNull();
	});

	it('are bound to their purpose', async () => {
		const token = await signToken('one', { x: 1 }, SECRET);
		expect(await verifyToken('one', token, SECRET)).toEqual({ x: 1 });
		expect(await verifyToken('two', token, SECRET)).toBeNull();
	});

	it('keep the link version in the session', async () => {
		const cookie = await signSession({ email: 'anna@example.org', name: 'Anna', exp: 9_999_999_999, link: 2 }, SECRET);
		expect((await verifySession(cookie, SECRET))?.link).toBe(2);
	});
});

describe('link versions', () => {
	it.each([
		['', 0],
		['3', 3],
		['-3', -3],
		['drei', 0]
	])('%j → %d', (text, version) => {
		expect(parseLinkVersion(text)).toBe(version);
	});

	it('a new link ends the old one', () => {
		expect(nextLinkVersion(0)).toBe(1);
		expect(nextLinkVersion(3)).toBe(4);
		expect(linkValid(4, 3)).toBe(false);
		expect(linkValid(4, 4)).toBe(true);
	});

	it('a revoked link stays invalid, and the next one is newer', () => {
		const revoked = revokedLinkVersion(3);
		expect(linkValid(revoked, 3)).toBe(false);
		expect(nextLinkVersion(revoked)).toBe(4);
		expect(linkValid(0, 0)).toBe(false);
	});
});
