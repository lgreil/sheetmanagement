import { error, json } from '@sveltejs/kit';
import { t } from '#lib/i18n/index.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { renameFile } from '#lib/server/google/drive.ts';
import { getLibrary } from '#lib/server/library.ts';
import { checkNamingSection, namingSections } from '#lib/server/naming.ts';
import { RENAME_BATCH } from '#lib/music/naming.ts';
import { driveWriteEnabled, getArchiveIndex, getGoogle } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

/**
 * Renames one small batch of files in one folder, so the page can show progress and rename
 * any number of files: free Workers allow 50 Google requests per call. The names are worked
 * out again here, so only names the check suggests are ever written. `refresh` re-reads
 * the archive once at the end instead of after every batch.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	requireRight(locals, 'stuecke.bearbeiten');
	if (!driveWriteEnabled()) error(409, t.naming.noDriveWrite);
	const body = (await request.json().catch(() => null)) as { key?: unknown; shortTitle?: unknown; ids?: unknown; refresh?: unknown } | null;
	if (!body) error(400, t.messages.badRequest);

	if (body.refresh === true) {
		await getArchiveIndex({ force: true }).catch((cause) => console.error('Refreshing the archive failed:', cause));
		return json({ renamed: [], failed: [] });
	}

	const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : [];
	if (typeof body.key !== 'string' || !ids.length || ids.length > RENAME_BATCH) error(400, t.messages.badRequest);
	const shortTitle = typeof body.shortTitle === 'string' ? body.shortTitle.slice(0, 120) : '';
	const section = namingSections(await getLibrary()).find((s) => s.key === body.key);
	if (!section) error(404, t.naming.gone);

	const wanted = new Set(ids);
	const renames = checkNamingSection(section, shortTitle).filter((check) => wanted.has(check.id) && check.state === 'rename');
	const { client } = getGoogle();
	const renamed: string[] = [];
	const failed: string[] = [];
	for (const check of renames) {
		try {
			await renameFile(client, check.id, check.suggested!);
			renamed.push(check.id);
		} catch (cause) {
			console.error('Renaming a file in Drive failed:', cause);
			failed.push(check.name);
		}
	}
	return json({ renamed, failed });
};
