import { fail } from '@sveltejs/kit';
import { t } from '#lib/i18n/index.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { renameFile } from '#lib/server/google/drive.ts';
import { getLibrary } from '#lib/server/library.ts';
import { checkNamingSection, namingSections } from '#lib/server/naming.ts';
import { driveWriteEnabled, getArchiveIndex, getGoogle } from '#lib/server/services.ts';
import type { Actions, PageServerLoad } from './$types';

// Looking after the sheet music is what "stuecke.bearbeiten" is for.
const RIGHT = 'stuecke.bearbeiten';
/** Free Workers allow 50 Google requests per call; the archive refresh after renaming needs some too. */
const MAX_RENAMES = 30;

export const load: PageServerLoad = async ({ locals }) => {
	requireRight(locals, RIGHT);
	const library = await getLibrary();
	const sections = namingSections(library)
		.map((section) => ({ ...section, checks: checkNamingSection(section) }))
		.filter((section) => section.checks.some((check) => check.state === 'rename' || check.state === 'unclear'));
	const count = (state: string) => sections.reduce((sum, s) => sum + s.checks.filter((c) => c.state === state).length, 0);
	return {
		ok: library.catalog.ok,
		driveWrite: driveWriteEnabled(),
		maxRenames: MAX_RENAMES,
		// The checks are recomputed in the browser when someone changes a short title.
		sections: sections.map(({ checks: _, ...section }) => section),
		counts: { rename: count('rename'), unclear: count('unclear'), folders: sections.length }
	};
};

export const actions: Actions = {
	rename: async ({ request, locals }) => {
		requireRight(locals, RIGHT);
		if (!driveWriteEnabled()) return fail(409, { message: t.naming.noDriveWrite });
		const data = await request.formData();
		const key = String(data.get('key') ?? '');
		const shortTitle = String(data.get('shortTitle') ?? '').slice(0, 120);
		const wanted = new Set(data.getAll('id').map(String));
		if (wanted.size > MAX_RENAMES) return fail(400, { key, message: t.naming.tooMany(MAX_RENAMES) });

		const section = namingSections(await getLibrary()).find((s) => s.key === key);
		if (!section) return fail(404, { key, message: t.naming.gone });
		// The names are worked out again here, so only names the check suggests are ever written.
		const renames = checkNamingSection(section, shortTitle).filter((check) => wanted.has(check.id) && check.state === 'rename');
		const { client } = getGoogle();
		const failed: string[] = [];
		for (const check of renames) {
			try {
				await renameFile(client, check.id, check.suggested!);
			} catch (error) {
				console.error('Renaming a file in Drive failed:', error);
				failed.push(check.name);
			}
		}
		// Show the new names right away instead of after the next scheduled refresh.
		await getArchiveIndex({ force: true }).catch((error) => console.error('Refreshing the archive failed:', error));
		const renamed = renames.length - failed.length;
		if (failed.length) return fail(502, { key, renamed, message: t.naming.failed(failed) });
		return { key, renamed };
	}
};
