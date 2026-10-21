import { error, type Cookies } from '@sveltejs/kit';
import { parseEmailList, resolveAccess, type Access, type Right, type User } from '#lib/access/access.ts';
import { DEMO_ADMIN, DEMO_MEMBER } from '../demo/data.ts';
import { appEnv, isDemo } from '../env.ts';
import { readAccessList } from '../repertoire.ts';
import { linkValid } from './links.ts';
import { verifySession } from './session.ts';

export const SESSION_COOKIE = 'session';
export const STATE_COOKIE = 'oauth_state';
const MIN_SECRET_LENGTH = 32;

export type AuthConfig =
	| {
			mode: 'off';
			/** "disabled": a client id is set, but FORCE_AUTH=false turned sign-in off. */
			reason: 'not-configured' | 'disabled';
	  }
	| {
			mode: 'on';
			clientId: string;
			clientSecret: string;
			sessionSecret: string;
			bootstrapAdmins: string[];
			/** Settings that are missing or too weak; sign-in fails until they're fixed. */
			problems: string[];
	  };

/** FORCE_AUTH=false (or 0, no, off) turns sign-in off; anything else, or nothing, leaves it on. */
export function signInForced(value: string | undefined): boolean {
	return !['false', '0', 'no', 'off'].includes((value ?? '').trim().toLowerCase());
}

/**
 * Sign-in is on as soon as GOOGLE_OAUTH_CLIENT_ID is set. Without it the app stays
 * open and read-only, as before phase 5, so a deployment can be set up step by step.
 * FORCE_AUTH=false turns it off again without removing the client id, e.g. for an
 * instance that should be open to everyone, or to get in while Google sign-in is broken.
 */
export function authConfig(): AuthConfig {
	const env = appEnv();
	// The demo is "signed in" without Google: as the admin, or as a member to see their view.
	if (isDemo()) {
		return { mode: 'on', clientId: 'demo', clientSecret: 'demo', sessionSecret: 'demo'.repeat(8), bootstrapAdmins: [DEMO_ADMIN.email], problems: [] };
	}
	const clientId = env.GOOGLE_OAUTH_CLIENT_ID?.trim();
	if (!clientId) return { mode: 'off', reason: 'not-configured' };
	if (!signInForced(env.FORCE_AUTH)) return { mode: 'off', reason: 'disabled' };
	const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ?? '';
	const sessionSecret = env.SESSION_SECRET?.trim() ?? '';
	const bootstrapAdmins = parseEmailList(env.BOOTSTRAP_ADMINS);
	const problems = [
		...(clientSecret ? [] : ['GOOGLE_OAUTH_CLIENT_SECRET ist nicht gesetzt.']),
		...(sessionSecret.length >= MIN_SECRET_LENGTH ? [] : [`SESSION_SECRET fehlt oder ist kürzer als ${MIN_SECRET_LENGTH} Zeichen.`]),
		...(bootstrapAdmins.length ? [] : ['BOOTSTRAP_ADMINS ist nicht gesetzt: niemand kann Mitglieder freischalten.'])
	];
	return { mode: 'on', clientId, clientSecret, sessionSecret, bootstrapAdmins, problems };
}

/** Without sign-in everyone may view, and nobody may change anything. */
const OPEN: Access = { user: null, member: true, bootstrapAdmin: false, rights: new Set<Right>(['ansehen']) };

/** Which demo user is "signed in": the admin by default, or the member (cookie set from the demo banner). */
export const DEMO_ROLE_COOKIE = 'demo_rolle';
export const demoUser = (cookies: Cookies) => (cookies.get(DEMO_ROLE_COOKIE) === 'mitglied' ? DEMO_MEMBER : DEMO_ADMIN);

export async function accessFromCookies(cookies: Cookies, auth: AuthConfig): Promise<Access> {
	if (auth.mode === 'off') return OPEN;
	if (isDemo()) {
		const user = demoUser(cookies);
		return resolveAccess(user, (await readAccessList()).list, auth.bootstrapAdmins);
	}
	const session = auth.sessionSecret ? await verifySession(cookies.get(SESSION_COOKIE), auth.sessionSecret) : null;
	const user: User | null = session ? { email: session.email, name: session.name } : null;
	if (!user) return resolveAccess(null, null, []);
	// A session from an access link lasts only as long as the link: always checked in the sheet.
	if (session?.link !== undefined) {
		const { list, failed } = await readAccessList();
		if (failed) return { ...resolveAccess(user, null, []), unavailable: true };
		const member = list?.membersByEmail.get(user.email.toLowerCase());
		if (!member || !linkValid(member.linkVersion, session.link)) return resolveAccess(null, null, []);
		return { ...resolveAccess(user, list, auth.bootstrapAdmins), viaLink: true };
	}
	// Bootstrap admins don't depend on the sheet, so a broken sheet can't lock them out.
	if (auth.bootstrapAdmins.includes(user.email.toLowerCase())) return resolveAccess(user, null, auth.bootstrapAdmins);
	const { list, failed } = await readAccessList();
	// Not "no access": an unreadable list says nothing about who's a member.
	if (failed) return { ...resolveAccess(user, null, []), unavailable: true };
	return resolveAccess(user, list, auth.bootstrapAdmins);
}

/** Pages anyone may open, signed in or not. */
export function isPublicPath(path: string): boolean {
	return (
		path === '/anmelden' ||
		path === '/zugang' ||
		// Linked from Google's sign-in screen, so they must be readable without an account.
		path === '/datenschutz' ||
		path === '/nutzungsbedingungen' ||
		path.startsWith('/auth/') ||
		path === '/api/health'
	);
}

/** For actions and pages that change things: a 403 unless the right is held. */
export function requireRight(locals: App.Locals, right: Right) {
	if (!locals.access.rights.has(right)) {
		error(locals.access.user || locals.auth === 'off' ? 403 : 401, 'Dafür fehlt dir die Berechtigung.');
	}
}

/**
 * Setup and status pages: open while sign-in is off (that's how a new deployment is
 * set up), afterwards for admins only.
 */
export function requireAdminWhenSignInIsOn(locals: App.Locals) {
	if (locals.auth === 'on') requireRight(locals, 'mitglieder.verwalten');
}
