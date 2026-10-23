import { normalizeEmail } from '#lib/access/access.ts';
import { signToken, verifyToken } from './session.ts';

/**
 * Links in emails (#123), signed with SESSION_SECRET and nothing stored: a sign-in link that
 * works for 15 minutes, and links in a reminder that answer one sign-up. Each purpose is
 * signed separately, so one kind of link is never taken for another.
 */

const SIGN_IN = 'mail-sign-in';
const ANSWER = 'signup-answer';
export const SIGN_IN_MINUTES = 15;

interface SignInData {
	e: string;
	/** Expiry, seconds since the epoch. */
	x: number;
}

interface AnswerData extends SignInData {
	/** The event's id. */
	ev: string;
}

const seconds = (ms: number) => Math.floor(ms / 1000);

export const signInLinkToken = (email: string, secret: string, now = Date.now()) =>
	signToken(SIGN_IN, { e: normalizeEmail(email), x: seconds(now) + SIGN_IN_MINUTES * 60 } satisfies SignInData, secret);

/** The email of a valid, unexpired sign-in link. */
export async function readSignInLink(token: string, secret: string, now = Date.now()): Promise<string | null> {
	const data = await verifyToken<SignInData>(SIGN_IN, token, secret);
	if (!data || typeof data.e !== 'string' || typeof data.x !== 'number' || data.x < seconds(now)) return null;
	return normalizeEmail(data.e);
}

/** Answering one event from a reminder; valid until `until` (the event's end, roughly). */
export const answerToken = (email: string, eventId: string, until: number, secret: string) =>
	signToken(ANSWER, { e: normalizeEmail(email), ev: eventId, x: seconds(until) } satisfies AnswerData, secret);

export async function readAnswerToken(token: string, secret: string, now = Date.now()): Promise<{ email: string; eventId: string } | null> {
	const data = await verifyToken<AnswerData>(ANSWER, token, secret);
	if (!data || typeof data.e !== 'string' || typeof data.ev !== 'string' || typeof data.x !== 'number' || data.x < seconds(now)) return null;
	return { email: normalizeEmail(data.e), eventId: data.ev };
}
