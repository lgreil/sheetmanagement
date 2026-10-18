import { error, fail, redirect } from '@sveltejs/kit';
import { parseEntries, planProgramSave, programVersion } from '#lib/repertoire/program-edit.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { getLibrary } from '#lib/server/library.ts';
import { getRepertoire } from '#lib/server/repertoire.ts';
import { appendRecords, deleteRows, readTab, refreshAfterWrite, SheetLayoutError } from '#lib/server/sheet-writes.ts';
import { t } from '#lib/i18n/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	requireRight(locals, 'programme.bearbeiten');
	const [library, repertoire] = await Promise.all([getLibrary(), getRepertoire()]);
	const concert = library.concertsById.get(params.id);
	if (!concert) error(404, 'Dieses Konzert gibt es nicht.');
	if (!concert.sheet || !repertoire.ok) {
		return { state: 'not-in-sheet' as const, concert: { id: concert.id, title: concert.title } };
	}

	const sheet = concert.sheet;
	return {
		state: 'ready' as const,
		concert: { id: concert.id, title: concert.title },
		version: programVersion(repertoire.repertoire.tables.program, sheet.title),
		entries: sheet.program.map((entry, i) => ({
			piece: entry.pieceName,
			notes: entry.notes ?? '',
			title: concert.program[i]?.title ?? entry.pieceName,
			subtitle: concert.program[i]?.subtitle
		})),
		// Only pieces with a row in "Stücke" can be picked; that's what the sheet's dropdown allows too.
		pieces: library.pieces
			.filter((piece) => piece.sheet?.title)
			.map((piece) => ({
				name: piece.sheet!.title,
				title: piece.title,
				subtitle: [piece.composer, piece.catalogue].filter(Boolean).join(' · ') || undefined,
				search: piece.search
			}))
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
		requireRight(locals, 'programme.bearbeiten');
		const data = await request.formData();
		const entries = parseEntries(String(data.get('entries') ?? ''));
		if (!entries) return fail(400, { message: 'Das Programm konnte nicht gelesen werden.' });

		const library = await getLibrary();
		const sheet = library.concertsById.get(params.id)?.sheet;
		if (!sheet) return fail(409, { message: t.editor.notInSheet });

		try {
			const table = await readTab('program');
			if (programVersion(table, sheet.title) !== String(data.get('version'))) {
				return fail(409, { message: t.editor.conflict });
			}
			const plan = planProgramSave(table, sheet.title, entries);
			// New rows first: if deleting the old ones fails, nothing is lost, only doubled.
			await appendRecords('program', table, plan.append);
			await deleteRows('program', plan.remove);
			await refreshAfterWrite();
		} catch (cause) {
			if (cause instanceof SheetLayoutError) return fail(409, { message: cause.message });
			console.error('Saving a programme failed:', cause);
			return fail(503, { message: 'Die Tabelle konnte gerade nicht geändert werden. Bitte versuch es noch einmal.' });
		}
		redirect(303, `/konzerte/${encodeURIComponent(params.id)}?gespeichert`);
	}
};
