import { config } from '#lib/config/index.ts';
import { cached, type CachedResult } from './cache.ts';
import { buildDriveIndex, INDEX_VERSION, type DriveIndex } from './drive-index.ts';
import { demoClient } from './demo/backend.ts';
import { DEMO_IDS } from './demo/data.ts';
import { appEnv, isDemo, runInBackground } from './env.ts';
import { createTokenProvider, parseServiceAccountKey, SCOPES, WRITE_SCOPES } from './google/auth.ts';
import { GoogleClient } from './google/client.ts';

const INDEX_MAX_AGE_MS = 5 * 60 * 1000;

export class NotConfiguredError extends Error {
	constructor(readonly variable: string) {
		super(`${variable} is not set`);
		this.name = 'NotConfiguredError';
	}
}

let google: { json: string; write: boolean; client: GoogleClient; email: string } | null = null;

/**
 * Whether the app may change files in Drive (DRIVE_WRITE=true). Off by default: reading needs
 * no more. The demo's Drive is in memory, so renaming and placeholders can be tried there.
 */
export function driveWriteEnabled(): boolean {
	if (isDemo()) return true;
	return ['true', '1', 'yes', 'on'].includes((appEnv().DRIVE_WRITE ?? '').trim().toLowerCase());
}

/** The Google client for this deployment. Token caching lives as long as the Worker instance. */
export function getGoogle(): { client: GoogleClient; serviceAccountEmail: string } {
	if (isDemo()) return { client: demoClient(), serviceAccountEmail: 'demo@example.org' };
	const json = appEnv().GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
	if (!json) throw new NotConfiguredError('GOOGLE_SERVICE_ACCOUNT_JSON');
	const write = driveWriteEnabled();
	if (google?.json !== json || google.write !== write) {
		const key = parseServiceAccountKey(json);
		const tokens = createTokenProvider(key, write ? WRITE_SCOPES : SCOPES);
		google = { json, write, client: new GoogleClient(tokens), email: key.client_email };
	}
	return { client: google.client, serviceAccountEmail: google.email };
}

export function requireSetting(
	name: 'CALENDAR_ID' | 'DRIVE_ARCHIVE_FOLDER_ID' | 'DRIVE_CURRENT_PROGRAM_FOLDER_ID' | 'REPERTOIRE_SHEET_ID'
): string {
	if (isDemo()) return { CALENDAR_ID: DEMO_IDS.calendar, DRIVE_ARCHIVE_FOLDER_ID: DEMO_IDS.archive, DRIVE_CURRENT_PROGRAM_FOLDER_ID: DEMO_IDS.program, REPERTOIRE_SHEET_ID: DEMO_IDS.sheet }[name];
	const value = appEnv()[name]?.trim();
	if (!value) throw new NotConfiguredError(name);
	return value;
}

/**
 * Current-programme folders: DRIVE_CURRENT_PROGRAM_FOLDER_ID, one id or several separated
 * by commas (or full folder links). Optional.
 */
export function programFolderIds(): string[] {
	if (isDemo()) return [DEMO_IDS.program];
	return (appEnv().DRIVE_CURRENT_PROGRAM_FOLDER_ID ?? '')
		.split(/[,;\s]+/)
		.map((value) => value.match(/folders\/([\w-]+)/)?.[1] ?? value)
		.filter((id) => /^[\w-]{10,}$/.test(id));
}

/** The archive index, served from cache and refreshed in the background every few minutes. */
export function getArchiveIndex({ force = false } = {}): Promise<CachedResult<DriveIndex>> {
	const archiveFolderId = requireSetting('DRIVE_ARCHIVE_FOLDER_ID');
	const programs = programFolderIds();
	const { client } = getGoogle();
	return cached({
		key: `drive-index:v${INDEX_VERSION}:${[archiveFolderId, ...programs].join(',')}`,
		maxAgeMs: INDEX_MAX_AGE_MS,
		build: () =>
			buildDriveIndex(client, {
				archiveFolderId,
				categoryFolderPattern: config.naming.categoryFolderPattern,
				programFolderIds: programs,
				programFolderPattern: config.naming.programFolderPattern
			}),
		kv: appEnv().CACHE,
		waitUntil: runInBackground,
		force
	});
}
