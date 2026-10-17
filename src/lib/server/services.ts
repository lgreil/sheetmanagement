import { config } from '#lib/config/index.ts';
import { cached, type CachedResult } from './cache.ts';
import { buildDriveIndex, INDEX_VERSION, type DriveIndex } from './drive-index.ts';
import { appEnv, runInBackground } from './env.ts';
import { createTokenProvider, parseServiceAccountKey } from './google/auth.ts';
import { GoogleClient } from './google/client.ts';

const INDEX_MAX_AGE_MS = 5 * 60 * 1000;

export class NotConfiguredError extends Error {
	constructor(readonly variable: string) {
		super(`${variable} is not set`);
		this.name = 'NotConfiguredError';
	}
}

let google: { json: string; client: GoogleClient; email: string } | null = null;

/** The Google client for this deployment. Token caching lives as long as the Worker instance. */
export function getGoogle(): { client: GoogleClient; serviceAccountEmail: string } {
	const json = appEnv().GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
	if (!json) throw new NotConfiguredError('GOOGLE_SERVICE_ACCOUNT_JSON');
	if (google?.json !== json) {
		const key = parseServiceAccountKey(json);
		google = { json, client: new GoogleClient(createTokenProvider(key)), email: key.client_email };
	}
	return { client: google.client, serviceAccountEmail: google.email };
}

export function requireSetting(
	name: 'CALENDAR_ID' | 'DRIVE_ARCHIVE_FOLDER_ID' | 'DRIVE_CURRENT_PROGRAM_FOLDER_ID' | 'REPERTOIRE_SHEET_ID'
): string {
	const value = appEnv()[name]?.trim();
	if (!value) throw new NotConfiguredError(name);
	return value;
}

/** The archive index, served from cache and refreshed in the background every few minutes. */
export function getArchiveIndex({ force = false } = {}): Promise<CachedResult<DriveIndex>> {
	const archiveFolderId = requireSetting('DRIVE_ARCHIVE_FOLDER_ID');
	const { client } = getGoogle();
	return cached({
		key: `drive-index:v${INDEX_VERSION}:${archiveFolderId}`,
		maxAgeMs: INDEX_MAX_AGE_MS,
		build: () => buildDriveIndex(client, archiveFolderId, config.naming.categoryFolderPattern),
		kv: appEnv().CACHE,
		waitUntil: runInBackground,
		force
	});
}
