import { error, fail, redirect } from '@sveltejs/kit';
import { parseEntries, planProgramSave, programVersion } from '#lib/repertoire/program-edit.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { isOn } from '#lib/server/env.ts';
import { getLibrary, type Library } from '#lib/server/library.ts';
import { getFeedback, getRepertoire } from '#lib/server/repertoire.ts';
import { planWishes } from '#lib/server/feedback.ts';
import { programSuggestions } from '#lib/repertoire/suggestions.ts';
import { appendRecords, deleteRows, readTab, refreshAfterWrite, SheetLayoutError, updateRecord } from '#lib/server/sheet-writes.ts';
import { normalize } from '#lib/repertoire/sheet.ts';
import { t } from '#lib/i18n/index.ts';
import { currentProgramAvailable, isCurrentConcert, syncCurrentProgram } from '#lib/server/current-program.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	requireRight(locals, 'programme.bearbeiten');
	const [library, repertoire, feedback] = await Promise.all([getLibrary(), getRepertoire(), getFeedback()]);
	const concert = library.concertsById.get(params.id);
	if (!concert) error(404, t.messages.noConcert);
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
			subtitle: concert.program[i]?.subtitle,
			duration: concert.program[i]?.duration
		})),
		suggestions: suggestions(library, concert.id, sheet.title, isOn('wishes') ? (feedback?.wishes ?? []) : []),
		sharedFrom: concert.sharedFrom,
		sharedWith: concert.sharedWith,
		shareOptions: shareOptions(library, concert.id),
		// Only pieces with a row in "Stücke" can be picked; that's what the sheet's dropdown allows too.
		pieces: library.pieces
			.filter((piece) => piece.sheet?.title)
			.map((piece) => ({
				name: piece.sheet!.title,
				title: piece.title,
				subtitle: [piece.composer, piece.catalogue].filter(Boolean).join(' · ') || undefined,
				duration: piece.sheet?.duration,
				search: piece.search
			}))
	};
};

/**
 * Concerts whose programme this one could take over (#70): those in the sheet with a
 * programme of their own, the ones closest in time first.
 */
function shareOptions(library: Library, concertId: string) {
	const concert = library.concertsById.get(concertId);
	// "1957" and "1957-12" count as the middle of the year or month.
	const day = (key: string) => Date.parse(key.length === 4 ? `${key}-07-01` : key.length === 7 ? `${key}-15` : key) / 86_400_000;
	const distance = (key: string) => (concert?.dateKey && key ? Math.abs(day(concert.dateKey) - day(key)) : Infinity);
	return library.concerts
		.filter((other) => other.id !== concertId && other.sheet?.title && other.program.length && !other.sharedFrom)
		.sort((a, b) => distance(a.dateKey) - distance(b.dateKey))
		.slice(0, 30)
		.map((other) => ({ name: other.sheet!.title, title: other.title, label: other.label?.long ?? other.dateText ?? '', count: other.program.length }));
}

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
			status: piece?.status,
			duration: piece?.sheet?.duration
		};
	};
	return { wished: result.wished.map(shown), longAgo: result.longAgo.map(shown), genres: result.genres };
}

/** Clears "Programm wie" on the concert's row, so its own rows count. */
async function clearShare(title: string) {
	const concerts = await readTab('concerts');
	if (concerts.indexes.sameProgramAs === undefined) return;
	const rows = concerts.rows.filter((row) => normalize(row.values.title) === normalize(title) && row.values.sameProgramAs);
	for (const row of rows) await updateRecord('concerts', concerts, row.row, { sameProgramAs: '' });
}

/** "ok" or "fehler" after syncing the Drive folder, empty when it isn't this concert's turn. */
async function syncIfCurrent(id: string): Promise<string> {
	if (!currentProgramAvailable()) return '';
	const library = await getLibrary();
	const concert = library.concertsById.get(id);
	if (!concert || !isCurrentConcert(concert, library)) return '';
	return syncCurrentProgram(concert, library).then(
		() => 'ok',
		(cause) => {
			console.error('Syncing the current programme failed:', cause);
			return 'fehler';
		}
	);
}

export const actions: Actions = {
	save: async ({ params, request, locals }) => {
		requireRight(locals, 'programme.bearbeiten');
		const data = await request.formData();
		const entries = parseEntries(String(data.get('entries') ?? ''));
		if (!entries) return fail(400, { message: t.messages.programUnreadable });

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
			await deleteRows('program', table, plan.remove);
			// A concert that played another one's programme now has its own.
			if (sheet.sameProgramAs) await clearShare(sheet.title);
			// Wishes taken into the programme become "geplant"; the programme counts even if this fails.
			const wishIds = String(data.get('wishes') ?? '').split(',').map((id) => id.trim()).filter(Boolean).slice(0, 50);
			await planWishes(wishIds).catch((cause) => console.error('Marking wishes as planned failed:', cause));
			await refreshAfterWrite();
		} catch (cause) {
			if (cause instanceof SheetLayoutError) return fail(409, { message: cause.message });
			console.error('Saving a programme failed:', cause);
			return fail(503, { message: t.messages.sheetFailed });
		}
		// The orchestra's next concert: its pieces go into "01 | Aktuelles Programm" too (#60).
		// The programme is saved either way; the concert page says how Drive went.
		const drive = await syncIfCurrent(params.id);
		redirect(303, `/konzerte/${encodeURIComponent(params.id)}?gespeichert${drive ? `&drive=${drive}` : ''}`);
	},

	/** Plays another concert's programme from now on; this concert's own rows go. */
	share: async ({ params, request, locals }) => {
		requireRight(locals, 'programme.bearbeiten');
		const data = await request.formData();
		const library = await getLibrary();
		const sheet = library.concertsById.get(params.id)?.sheet;
		if (!sheet) return fail(409, { message: t.editor.notInSheet });
		const source = library.concerts.find((other) => other.sheet && normalize(other.sheet.title) === normalize(String(data.get('source') ?? '')));
		if (!source?.sheet || source.sheet.key === sheet.key || !source.program.length) {
			return fail(400, { message: t.editor.shareUnknown });
		}

		try {
			const [table, concerts] = await Promise.all([readTab('program'), readTab('concerts')]);
			if (programVersion(table, sheet.title) !== String(data.get('version'))) {
				return fail(409, { message: t.editor.conflict });
			}
			const row = concerts.rows.find((r) => normalize(r.values.title) === normalize(sheet.title));
			if (!row) return fail(409, { message: t.editor.notInSheet });
			// The column first: if that fails, the old programme is still there.
			await updateRecord('concerts', concerts, row.row, { sameProgramAs: source.sheet.title });
			await deleteRows('program', table, planProgramSave(table, sheet.title, []).remove);
			await refreshAfterWrite();
		} catch (cause) {
			if (cause instanceof SheetLayoutError) return fail(409, { message: t.editor.shareNeedsSetup });
			console.error('Sharing a programme failed:', cause);
			return fail(503, { message: t.messages.sheetFailed });
		}
		redirect(303, `/konzerte/${encodeURIComponent(params.id)}?gespeichert`);
	}
};
