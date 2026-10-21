import { normalizeEmail } from '#lib/access/access.ts';
import { signToken, verifyToken } from './session.ts';

/**
 * The personal calendar feed (#122): a signed token for the member's email and the
 * "Kalender-Version" in "Mitglieder", counted like the access links (#96). A new link or
 * revoking changes the version, which ends the old link. The token only opens the feed,
 * never the app.
 */

const PURPOSE = 'calendar-feed';

interface FeedData {
	e: string;
	v: number;
}

export const feedToken = (email: string, version: number, secret: string) =>
	signToken(PURPOSE, { e: normalizeEmail(email), v: version } satisfies FeedData, secret);

/** The email and version in a feed token, or null if it isn't one of ours. */
export async function readFeedToken(token: string, secret: string): Promise<{ email: string; version: number } | null> {
	const data = await verifyToken<FeedData>(PURPOSE, token, secret);
	if (!data || typeof data.e !== 'string' || !Number.isInteger(data.v) || data.v < 1) return null;
	return { email: normalizeEmail(data.e), version: data.v };
}
