import { requireRight } from '#lib/server/auth/index.ts';
import { getLibrary } from '#lib/server/library.ts';
import { checkNamingSection, namingSections } from '#lib/server/naming.ts';
import { driveWriteEnabled } from '#lib/server/services.ts';
import type { PageServerLoad } from './$types';

// Looking after the sheet music is what "stuecke.bearbeiten" is for. Renaming runs in
// batches through ./umbenennen, so the page can show progress.
const RIGHT = 'stuecke.bearbeiten';

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
		// The checks are recomputed in the browser when someone changes a short title.
		sections: sections.map(({ checks: _, ...section }) => section),
		counts: { rename: count('rename'), unclear: count('unclear'), folders: sections.length }
	};
};
