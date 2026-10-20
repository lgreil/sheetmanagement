import { normalizeEmail } from '#lib/access/access.ts';
import { signToken, verifyToken } from './session.ts';

/**
 * Personal access links for members without a Google account (#96). An admin creates one
 * in /admin and sends it themselves. The link is a signed token for the member's email and
 * the link version in "Mitglieder": a new link (or revoking) changes the version, which
 * ends the old link and every session opened with it.
 *
 * Versions: 0 no link yet, n > 0 link n is valid, -n link n was revoked. The next link
 * always gets a higher number, so a revoked link never becomes valid again.
 */

const PURPOSE = 'access-link';

interface LinkData {
	e: string;
	v: number;
}

export const linkToken = (email: string, version: number, secret: string) =>
	signToken(PURPOSE, { e: normalizeEmail(email), v: version } satisfies LinkData, secret);

/** The email and version in a link, or null if it isn't one of ours. */
export async function readLinkToken(token: string, secret: string): Promise<{ email: string; version: number } | null> {
	const data = await verifyToken<LinkData>(PURPOSE, token, secret);
	if (!data || typeof data.e !== 'string' || !Number.isInteger(data.v) || data.v < 1) return null;
	return { email: normalizeEmail(data.e), version: data.v };
}

/** The version for a new link: one above any earlier, revoked or not. */
export const nextLinkVersion = (current: number) => Math.abs(current) + 1;

/** Revoking keeps the number, so the next link is still higher. */
export const revokedLinkVersion = (current: number) => -Math.abs(current);

/** Whether a link (or a session from it) with this version is still good. */
export const linkValid = (current: number, version: number) => current > 0 && current === version;
