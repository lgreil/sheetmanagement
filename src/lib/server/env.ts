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
	/** KV namespace binding from wrangler.toml; optional, memory is used without it. */
	CACHE?: KvStore;
}

export function appEnv(): AppEnv {
	return env as unknown as AppEnv;
}

/** Lets work continue after the response is sent (e.g. a cache refresh). */
export function runInBackground(promise: Promise<unknown>) {
	waitUntil(promise);
}
