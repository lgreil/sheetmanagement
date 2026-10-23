import { describe, expect, it } from 'vitest';
import { linkToken } from './links.ts';
import { answerToken, readAnswerToken, readSignInLink, signInLinkToken, SIGN_IN_MINUTES } from './mail-links.ts';

const secret = 'x'.repeat(32);
const now = Date.parse('2026-10-23T10:00:00Z');

describe('links in emails (#123)', () => {
	it('sign in for 15 minutes', async () => {
		const token = await signInLinkToken(' Mia@Example.org ', secret, now);
		expect(await readSignInLink(token, secret, now + 60_000)).toBe('mia@example.org');
		expect(await readSignInLink(token, secret, now + (SIGN_IN_MINUTES * 60 + 1) * 1000)).toBeNull();
		expect(await readSignInLink(token, 'y'.repeat(32), now)).toBeNull();
	});

	it('are never taken for another kind of link', async () => {
		const answer = await answerToken('mia@example.org', 'event-1', now + 86_400_000, secret);
		expect(await readSignInLink(answer, secret, now)).toBeNull();
		expect(await readSignInLink(await linkToken('mia@example.org', 1, secret), secret, now)).toBeNull();
		expect(await readAnswerToken(await signInLinkToken('mia@example.org', secret, now), secret, now)).toBeNull();
	});

	it('answer one event until it is over', async () => {
		const token = await answerToken('mia@example.org', 'event-1', now + 86_400_000, secret);
		expect(await readAnswerToken(token, secret, now)).toEqual({ email: 'mia@example.org', eventId: 'event-1' });
		expect(await readAnswerToken(token, secret, now + 2 * 86_400_000)).toBeNull();
	});
});
