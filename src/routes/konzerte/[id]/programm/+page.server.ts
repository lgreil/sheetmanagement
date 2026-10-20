import { error, fail, redirect } from '@sveltejs/kit';
import { parseEntries, planProgramSave, programVersion } from '#lib/repertoire/program-edit.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { getLibrary, type Library } from '#lib/server/library.ts';
import { getFeedback, getRepertoire } from '#lib/server/repertoire.ts';
import { planWishes } from '#lib/server/feedback.ts';
import { programSuggestions } from '#lib/repertoire/suggestions.ts';
import { appendRecords, deleteRows, readTab, refreshAfterWrite, SheetLayoutError } from '#lib/server/sheet-writes.ts';
import { t } from '#lib/i18n/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	requireRight(locals, 'programme.bearbeiten');
	const [library, repertoire, feedback] = await Promise.all([getLibrary(), getRepertoire(), getFeedback()]);
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
		suggestions: suggestions(library, concert.id, sheet.title, feedback?.wishes ?? []),
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

/** Wishes for this concert or any time, and pieces not played for long, ready to add (#91, #108). */
function suggestions(library: Library, concertId: string, concertTitle: string, wishes: NonNullable<Awaited<ReturnType<typeof getFeedback>>>['wishes']) {
	const concert = library.concertsById.get(concertId);
	const lastPlayed = (ids: string[]) =>
		ids
			.map((id) => library.concertsById.get(id)?.dateKey)
			.filter((key): key is string => !!key && key < library.today)
			.sort()
			.at(-1);
	const result = programSuggestions({
		concertTitle,
		programPieceIds: (concert?.program ?? []).flatMap((item) => item.pieceId ?? []),
		today: library.today,
		pieces: library.pieces.map((piece) => ({
			id: piece.id,
			title: piece.title,
			genre: piece.sheet?.genre,
			lastPlayed: lastPlayed(piece.playedAt),
			pickable: !!piece.sheet?.title
		})),
		wishes: wishes
			.filter((wish) => wish.kind === 'piece')
			.map(({ id, title, pieceId, concert: wishConcert, votes, status }) => ({ id, title, pieceId, concert: wishConcert, votes: votes.length, status }))
	});
	// What the editor needs to add one, plus hints for the planner.
	const shown = (suggestion: (typeof result.wished)[number]) => {
		const piece = suggestion.pieceId ? library.piecesById.get(suggestion.pieceId) : undefined;
		return {
			...suggestion,
			name: piece?.sheet?.title,
			subtitle: piece ? [piece.composer, piece.catalogue].filter(Boolean).join(' · ') || undefined : undefined,
			status: piece?.status
		};
	};
	return { wished: result.wished.map(shown), longAgo: result.longAgo.map(shown), genres: result.genres };
}

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
			// Wishes taken into the programme become "geplant"; the programme counts even if this fails.
			const wishIds = String(data.get('wishes') ?? '').split(',').map((id) => id.trim()).filter(Boolean).slice(0, 50);
			await planWishes(wishIds).catch((cause) => console.error('Marking wishes as planned failed:', cause));
			await refreshAfterWrite();
		} catch (cause) {
			if (cause instanceof SheetLayoutError) return fail(409, { message: cause.message });
			console.error('Saving a programme failed:', cause);
			return fail(503, { message: 'Die Tabelle konnte gerade nicht geändert werden. Bitte versuch es noch einmal.' });
		}
		redirect(303, `/konzerte/${encodeURIComponent(params.id)}?gespeichert`);
	}
};
