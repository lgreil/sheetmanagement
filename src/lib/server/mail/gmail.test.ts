import { describe, expect, it } from 'vitest';
import { accessToken, buildMessage, encodeHeader, MailError, sendGmail } from './gmail.ts';

const decode = (raw: string) => new TextDecoder().decode(Uint8Array.from(atob(raw.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

describe('Gmail (#123)', () => {
	it('encodes headers that aren’t plain ASCII', () => {
		expect(encodeHeader('Probe am Montag')).toBe('Probe am Montag');
		expect(encodeHeader('Grüße\r\nBcc: x@y')).toMatch(/^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/);
	});

	it('builds a plain-text message with CRLF and a base64 body', () => {
		const message = buildMessage({ from: { name: 'Bachkreis Münster', email: 'orchester@example.org' }, to: 'mia@example.org', subject: 'Kommst du?', text: 'Hallo Mia,\nbis Montag' });
		const [head, body] = message.split('\r\n\r\n');
		expect(head).toContain('From: =?UTF-8?B?');
		expect(head).toContain(' <orchester@example.org>');
		expect(head).toContain('To: mia@example.org');
		expect(head).toContain('Content-Type: text/plain; charset=UTF-8');
		expect(decode(body.replace(/\r\n/g, ''))).toBe('Hallo Mia,\r\nbis Montag');
	});

	it('refuses addresses that would add recipients or headers', () => {
		expect(() => buildMessage({ from: { name: 'A', email: 'a@x.org' }, to: 'b@x.org\r\nBcc: c@x.org', subject: 's', text: 't' })).toThrow(MailError);
		expect(() => buildMessage({ from: { name: 'A', email: 'a@x.org' }, to: 'b@x.org, c@x.org', subject: 's', text: 't' })).toThrow(MailError);
	});

	it('says when Google took the permission back', async () => {
		const revoked = (async () => Response.json({ error: 'invalid_grant' }, { status: 400 })) as typeof fetch;
		await expect(accessToken({ clientId: 'id', clientSecret: 'secret' }, 'refresh', revoked)).rejects.toMatchObject({ revoked: true });
		const ok = (async () => Response.json({ access_token: 'token', expires_in: 3600 })) as typeof fetch;
		expect((await accessToken({ clientId: 'id', clientSecret: 'secret' }, 'refresh', ok)).token).toBe('token');
	});

	it('sends the message as base64url', async () => {
		let sent: { raw: string } | undefined;
		const fetchImpl = (async (_: unknown, init?: RequestInit) => ((sent = JSON.parse(String(init?.body))), Response.json({ id: '1' }))) as typeof fetch;
		await sendGmail('token', { from: { name: 'A', email: 'a@x.org' }, to: 'b@x.org', subject: 'Hi', text: 'Text' }, fetchImpl);
		expect(sent?.raw).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(decode(sent!.raw)).toContain('To: b@x.org');
	});
});
