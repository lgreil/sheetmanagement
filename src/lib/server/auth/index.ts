import { error, type Cookies } from '@sveltejs/kit';
import { parseEmailList, resolveAccess, type Access, type Right, type User } from '#lib/access/access.ts';
import { appEnv } from '../env.ts';
import { getAccessList } from '../repertoire.ts';
import { verifySession } from './session.ts';

export const SESSION_COOKIE = 'session';
export const STATE_COOKIE = 'oauth_state';
const MIN_SECRET_LENGTH = 32;

export type AuthConfig =
	| { mode: 'off' }
	| {
			mode: 'on';
			clientId: string;
			clientSecret: string;
			sessionSecret: string;
			bootstrapAdmins: string[];
			/** Settings that are missing or too weak; sign-in fails until they're fixed. */
			problems: string[];
	  };

/**
 * Sign-in is on as soon as GOOGLE_OAUTH_CLIENT_ID is set. Without it the app stays
 * open and read-only, as before phase 5, so a deployment can be set up step by step.
 */
export function authConfig(): AuthConfig {
	const env = appEnv();
	const clientId = env.GOOGLE_OAUTH_CLIENT_ID?.trim();
	if (!clientId) return { mode: 'off' };
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

export async function accessFromCookies(cookies: Cookies, auth: AuthConfig): Promise<Access> {
	if (auth.mode === 'off') return OPEN;
	const session = auth.sessionSecret ? await verifySession(cookies.get(SESSION_COOKIE), auth.sessionSecret) : null;
	const user: User | null = session ? { email: session.email, name: session.name } : null;
	if (!user) return resolveAccess(null, null, []);
	// Bootstrap admins don't depend on the sheet, so a broken sheet can't lock them out.
	const bootstrap = auth.bootstrapAdmins.includes(user.email.toLowerCase());
	return resolveAccess(user, bootstrap ? null : await getAccessList(), auth.bootstrapAdmins);
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
