import { fail, redirect } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { searchText } from '#lib/music/text.ts';
import { checkNewConcert, checkNewPiece, type ArchiveProblem, type NewConcert } from '#lib/repertoire/archive-edit.ts';
import { requireRight } from './auth/index.ts';
import { getLibrary } from './library.ts';
import { appendRecords, readTab, refreshAfterWrite, SheetLayoutError } from './sheet-writes.ts';

/**
 * Adding the orchestra's history ("archiv.bearbeiten"): past concerts and pieces without
 * sheet music, as rows in the sheet. Fresh read, checks, append; then on to the new entry.
 */

const RIGHT = 'archiv.bearbeiten';
const field = (data: FormData, name: string) => String(data.get(name) ?? '').slice(0, 200);

/** Runs the write; a refused entry or a failed write becomes a message (and status) for the form. */
async function save(work: () => Promise<ArchiveProblem | undefined>): Promise<{ status: number; message: string } | undefined> {
	try {
		const problem = await work();
		return problem ? { status: 400, message: t.archive.problems[problem] } : undefined;
	} catch (cause) {
		if (cause instanceof SheetLayoutError) return { status: 409, message: cause.message };
		console.error('Adding to the archive failed:', cause);
		return { status: 503, message: t.archive.failed };
	}
}

/**
 * A past concert, entered with the dates on /kalender: a row in the sheet, then on to it.
 * Returns what's wrong when it's refused; the caller shows it on its form.
 */
export async function addPastConcert(locals: App.Locals, entry: NewConcert) {
	requireRight(locals, RIGHT);
	const input = { ...entry, orchestra: config.orchestras.includes(entry.orchestra) ? entry.orchestra : '' };

	const refused = await save(async () => {
		const table = await readTab('concerts');
		const checked = checkNewConcert(input, table);
		if ('problem' in checked) return checked.problem;
		await appendRecords('concerts', table, [checked.values]);
		await refreshAfterWrite();
	});
	if (refused) return refused;

	// Sheet-only concerts are keyed by "Anlass"; find the new one to open it.
	const added = (await getLibrary()).concerts.find((c) => !c.event && searchText(c.title) === searchText(input.title.trim()));
	redirect(303, added ? `/kalender/${encodeURIComponent(added.id)}` : '/kalender');
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
	});
	if (refused) return fail(refused.status, { archiveError: refused.message, values: input });

	const added = (await getLibrary()).pieces.find((p) => !p.detail && searchText(p.title) === searchText(input.title.trim()));
	redirect(303, added ? `/stuecke/${encodeURIComponent(added.id)}` : '/stuecke');
}
