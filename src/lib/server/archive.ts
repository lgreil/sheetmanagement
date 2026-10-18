import { fail, redirect } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { searchText } from '#lib/music/text.ts';
import { checkNewConcert, checkNewPiece, type ArchiveProblem } from '#lib/repertoire/archive-edit.ts';
import { requireRight } from './auth/index.ts';
import { getLibrary } from './library.ts';
import { appendRecords, readTab, refreshAfterWrite, SheetLayoutError } from './sheet-writes.ts';

/**
 * Adding the orchestra's history ("archiv.bearbeiten"): past concerts and pieces without
 * sheet music, as rows in the sheet. Fresh read, checks, append; then on to the new entry.
 */

const RIGHT = 'archiv.bearbeiten';
const field = (data: FormData, name: string) => String(data.get(name) ?? '').slice(0, 200);

/** Runs the write; a refused entry or a failed write becomes a message on the form. */
async function save(work: () => Promise<ArchiveProblem | undefined>, values: Record<string, string>) {
	try {
		const problem = await work();
		return problem ? fail(400, { archiveError: t.archive.problems[problem], values }) : undefined;
	} catch (cause) {
		if (cause instanceof SheetLayoutError) return fail(409, { archiveError: cause.message, values });
		console.error('Adding to the archive failed:', cause);
		return fail(503, { archiveError: t.archive.failed, values });
	}
}

export async function addConcert(locals: App.Locals, request: Request) {
	requireRight(locals, RIGHT);
	const data = await request.formData();
	const input = { date: field(data, 'date'), title: field(data, 'title'), location: field(data, 'location'), orchestra: field(data, 'orchestra') };
	if (input.orchestra && !config.orchestras.includes(input.orchestra)) input.orchestra = '';

	const refused = await save(async () => {
		const table = await readTab('concerts');
		const checked = checkNewConcert(input, table);
		if ('problem' in checked) return checked.problem;
		await appendRecords('concerts', table, [checked.values]);
		await refreshAfterWrite();
	}, input);
	if (refused) return refused;

	// Sheet-only concerts are keyed by "Anlass"; find the new one to open it.
	const added = (await getLibrary()).concerts.find((c) => !c.event && searchText(c.title) === searchText(input.title.trim()));
	redirect(303, added ? `/konzerte/${encodeURIComponent(added.id)}` : '/konzerte');
}

export async function addPiece(locals: App.Locals, request: Request) {
	requireRight(locals, RIGHT);
	const data = await request.formData();
	const input = { title: field(data, 'title'), composer: field(data, 'composer'), catalogue: field(data, 'catalogue') };

	const refused = await save(async () => {
		const table = await readTab('pieces');
		const checked = checkNewPiece(input, table);
		if ('problem' in checked) return checked.problem;
		await appendRecords('pieces', table, [checked.values]);
		await refreshAfterWrite();
	}, input);
	if (refused) return refused;

	const added = (await getLibrary()).pieces.find((p) => !p.detail && searchText(p.title) === searchText(input.title.trim()));
	redirect(303, added ? `/stuecke/${encodeURIComponent(added.id)}` : '/stuecke');
}
