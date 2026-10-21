import { env, waitUntil } from 'cloudflare:workers';
import type { KvStore } from './cache.ts';

/**
 * Deployment settings. Set them with `wrangler secret put <NAME>` in production
 * and in `.dev.vars` locally; see `.dev.vars.example`.
 */
export interface AppEnv {
	ORCHESTRA_NAME?: string;
	ORCHESTRA_SHORT_NAME?: string;
	GOOGLE_SERVICE_ACCOUNT_JSON?: string;
	CALENDAR_ID?: string;
	DRIVE_ARCHIVE_FOLDER_ID?: string;
	DRIVE_CURRENT_PROGRAM_FOLDER_ID?: string;
	REPERTOIRE_SHEET_ID?: string;
	/** "true" lets the app mirror problem reports into Drive (comments, status words in file names). Needs the service account as editor. */
	DRIVE_WRITE?: string;
	/** Google sign-in (OAuth client of type "Web application"). Without it the app is open and read-only. */
	GOOGLE_OAUTH_CLIENT_ID?: string;
	GOOGLE_OAUTH_CLIENT_SECRET?: string;
	/** At least 32 random characters; signs the session cookies. */
	SESSION_SECRET?: string;
	/** "false" turns sign-in off although GOOGLE_OAUTH_CLIENT_ID is set: the app is then open and read-only. Default: on. */
	FORCE_AUTH?: string;
	/** Comma-separated emails that always have every right. */
	BOOTSTRAP_ADMINS?: string;
	/** Who is responsible for the app, for the privacy notice (defaults to ORCHESTRA_NAME). */
	LEGAL_NAME?: string;
	/** Postal address of the responsible person or club, e.g. "Musterstraße 1, 12345 Musterstadt". */
	LEGAL_ADDRESS?: string;
	/** Contact email for privacy questions. */
	LEGAL_EMAIL?: string;
	/** "true": sample data instead of Google, signed in as a demo user; for trying the app (#121). */
	DEMO?: string;
	/** KV namespace binding from wrangler.toml; optional, memory is used without it. */
	CACHE?: KvStore;
}

export function appEnv(): AppEnv {
	return env as unknown as AppEnv;
}

/** Demo mode: invented sample data in memory instead of Google, no real accounts. */
export function isDemo(): boolean {
	return ['true', '1', 'yes', 'on'].includes((appEnv().DEMO ?? '').trim().toLowerCase());
}

/** Lets work continue after the response is sent (e.g. a cache refresh). */
export function runInBackground(promise: Promise<unknown>) {
	waitUntil(promise);
}
