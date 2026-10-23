import { error, fail } from '@sveltejs/kit';
import { newId, REPORT_KINDS, type ReportKind } from '#lib/feedback/feedback.ts';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { commonInstruments, formatInstrument, playableInstruments } from '#lib/music/my-parts.ts';
import { addReport, feedbackUser, formText, playAgain } from '#lib/server/feedback.ts';
import { features, isOn } from '#lib/server/env.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { getFeedback, getLoans, getPieceNotes, getRehearsalPlan } from '#lib/server/repertoire.ts';
import { checkNote, notesOf, sectionOptions } from '#lib/notes/piece-notes.ts';
import { today } from '#lib/server/members.ts';
import { normalize } from '#lib/repertoire/sheet.ts';
import { daysUntilDue, loanState, loansOf } from '#lib/loans/loans.ts';
import { formatDay } from '#lib/events/format.ts';
import { pieceArt } from '#lib/music/piece-art.ts';
import { portraitFor, portraitPageUrl } from '#lib/server/portraits.ts';
import { appendRecords, deleteRows, ensureTab, readTab, refreshAfterWrite, SheetLayoutError } from '#lib/server/sheet-writes.ts';
import { folderUrl, partUrl } from '#lib/server/catalog.ts';
import { listsOverlap } from '#lib/repertoire/lists.ts';
import { workKey } from '#lib/music/piece-name.ts';
import { formatDuration } from '#lib/repertoire/duration.ts';
import { concertSummary, getLibrary, isPastConcert, namedItem, type Library, type LibraryPiece } from '#lib/server/library.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const on = features();
	const [library, feedback, plan, loans, pieceNotes] = await Promise.all([
		getLibrary(),
		getFeedback(),
		getRehearsalPlan(),
		on.loans ? getLoans() : null,
		getPieceNotes()
	]);
	const piece = library.piecesById.get(params.id);
	if (!piece) {
		if (!library.catalog.ok) error(503, t.messages.archiveUnavailable);
		error(404, t.messages.noPiece);
	}

	const { detail, sheet } = piece;
	const byComposer = piece.composer
		? library.pieces.filter((other) => other.id !== piece.id && sameComposer(other.composer, piece.composer))
		: [];
	const work = workKey(piece.title);
	const canClose = locals.access.rights.has('stuecke.bearbeiten');
	// "Wieder spielen": the +1s on the piece's open or planned wish.
	const user = feedbackUser(locals);
	const againWish = (feedback?.wishes ?? []).find((wish) => wish.pieceId === piece.id && (wish.status === 'open' || wish.status === 'planned'));
	// The banner's picture: the composer's portrait, else a drawing for the genre or the title.
	const portrait = await portraitFor(piece.composer);
	return {
		banner: {
			art: pieceArt({ genre: sheet?.genre, title: piece.title }),
			portrait: portrait && {
				src: `/api/portraet?komponist=${encodeURIComponent(portrait.query)}`,
				name: portrait.name,
				source: portraitPageUrl(portrait.file)
			}
		},
		canEdit: locals.access.rights.has('stuecke.bearbeiten') && !!sheet,
		saved: url.searchParams.has('gespeichert'),
		// How many programmes followed a rename.
		renamedIn: Number(url.searchParams.get('gespeichert')) || 0,
		// Open problem reports, so nobody reports the same thing twice. Who reported is for admins only.
		reports: {
			open: (feedback?.reports ?? [])
				.filter((report) => report.pieceId === piece.id && report.status === 'open')
				.map(({ id, part, fileId, kind, comment, reportedAt, reportedBy }) => ({
					id,
					part,
					fileId,
					kind,
					comment,
					reportedAt,
					reportedBy: canClose ? reportedBy : undefined
				})),
			state: !detail
				? ('no-parts' as const)
				: !feedbackUser(locals)
					? ('sign-in' as const)
					: feedback?.tables.reports
						? ('ready' as const)
						: ('not-set-up' as const),
			canClose,
			instruments: playableInstruments(config),
			common: commonInstruments(config),
			present: [...new Set((detail?.parts ?? []).filter((part) => part.status !== 'missing').flatMap((part) => part.instruments))]
		},
		piece: {
			id: piece.id,
			title: piece.title,
			composer: piece.composer,
			catalogue: piece.catalogue,
			category: piece.category,
			programs: piece.programs,
			partCount: piece.partCount,
			status: piece.status,
			folderUrl: detail ? folderUrl(detail.id) : undefined,
			recording: sheet?.recording,
			parts: (detail?.parts ?? []).map((part) => ({ ...part, url: partUrl(part.id, part.mimeType, locals.access.viaLink) })),
			sections: (detail?.sections ?? []).map((section) => ({ ...section, folderUrl: folderUrl(section.folderId) })),
			info: {
				duration: sheet?.duration ? formatDuration(sheet.duration) : undefined,
				publisher: sheet?.publisher,
				arranger: sheet?.arranger,
				genre: sheet?.genre,
				difficulty: sheet?.difficulty,
				// "2026-10-22" reads "22. Oktober 2026"; anything else as entered.
				reviewedAt: sheet?.reviewedAt && /^\d{4}-\d{2}-\d{2}$/.test(sheet.reviewedAt) ? formatDay(sheet.reviewedAt, config.locale) : sheet?.reviewedAt,
				notes: sheet?.notes
			}
		},
		again: user && on.wishes && feedback?.tables.wishes
			? {
					votes: againWish?.votes.length ?? 0,
					mine: !!againWish?.votes.includes(user.email.toLowerCase()),
					planned: againWish?.status === 'planned'
				}
			: null,
		// Rented or borrowed (#119): from whom and until when, so it goes back in time.
		loans: loansOf(loans?.loans ?? [], sheet?.title ?? piece.title).map((loan) => ({
			from: loan.from,
			dueAt: loan.dueAt ? formatDay(loan.dueAt, config.locale) : loan.dueText || undefined,
			state: loanState(loan, library.today),
			days: daysUntilDue(loan, library.today)
		})),
		canManageLoans: canClose && !!loans,
		// Coming up: concerts with this piece on the programme and rehearsals that plan it.
		upcoming: upcoming(library, piece, plan?.byEvent),
		playedAt: piece.playedAt
			.map((id) => library.concertsById.get(id))
			.filter((concert) => concert !== undefined)
			.filter((concert) => !concert.event || concert.event.past)
			.map(concertSummary),
		// Other folders of the same work ("Sinfonie Nr4 Satz 2 - Streicherbesetzung"), then
		// "Weitere Werke von Bach": the same composer, as read from the folder or corrected in the sheet.
		otherVersions: byComposer.filter((other) => work && workKey(other.title) === work).map(summary),
		moreByComposer: byComposer.filter((other) => !work || workKey(other.title) !== work).map(summary),
		sheet: library.sheet,
		notes: notesFor(library, piece, pieceNotes.notes, locals)
	};
};

/** Upcoming calendar events this piece is part of, soonest first. */
function upcoming(library: Library, piece: LibraryPiece, planned: Map<string, { pieceName: string }[]> | undefined) {
	if (!library.schedule.ok) return [];
	const concerts = new Set(piece.playedAt);
	return library.schedule.events.filter(
		(event) =>
			!event.past &&
			(event.type === 'konzert'
				? concerts.has(event.id)
				: (planned?.get(event.id) ?? []).some((entry) => namedItem(library, entry.pieceName).pieceId === piece.id))
	);
}

/**
 * The piece's notes from rehearsals (#125): current ones, and those for concerts that are
 * over, kept apart so an old cut doesn't confuse the next performance. Who may write them
 * gets the choices for "Für" and "Konzert".
 */
function notesFor(library: Library, piece: LibraryPiece, notes: Awaited<ReturnType<typeof getPieceNotes>>['notes'], locals: App.Locals) {
	const concerts = new Map(library.concerts.flatMap((concert) => (concert.sheet ? [[normalize(concert.sheet.title), concert] as const] : [])));
	const shown = notesOf(notes, piece.sheet?.title ?? piece.title).map((note) => {
		const concert = note.concert ? concerts.get(normalize(note.concert)) : undefined;
		return {
			id: note.id,
			text: note.text,
			section: note.section,
			concert: note.concert ? (concert?.title ?? note.concert) : undefined,
			by: note.by,
			at: /^\d{4}-\d{2}-\d{2}$/.test(note.at) ? formatDay(note.at, config.locale) : note.at,
			earlier: !!concert && isPastConcert(concert, library.today)
		};
	});
	const canWrite = locals.access.rights.has('programme.bearbeiten') && !!piece.sheet;
	return {
		current: shown.filter((note) => !note.earlier),
		earlier: shown.filter((note) => note.earlier),
		form: canWrite ? { ...sectionOptions(config), concerts: noteConcerts(library, piece) } : null
	};
}

/** The concerts a note can be for: coming ones with a row in the sheet, those playing the piece first. */
function noteConcerts(library: Library, piece: LibraryPiece) {
	return library.concerts
		.filter((concert) => concert.sheet && !isPastConcert(concert, library.today))
		.reverse()
		.sort((a, b) => Number(piece.playedAt.includes(b.id)) - Number(piece.playedAt.includes(a.id)))
		.map((concert) => ({ value: concert.sheet!.title, label: concert.label ? `${concert.title} · ${concert.label.long}` : concert.title }));
}

/** Shares a composer: "Mozart, Haydn" and "Haydn" do. */
const sameComposer = listsOverlap;

const summary = ({ id, title, catalogue, status, programs }: LibraryPiece) => ({ id, title, catalogue, status, programs });

export const actions: Actions = {
	addNote: async ({ params, request, locals }) => {
		requireRight(locals, 'programme.bearbeiten');
		const library = await getLibrary();
		const piece = library.piecesById.get(params.id);
		if (!piece?.sheet) error(404, t.messages.noPiece);
		const data = await request.formData();
		const input = { text: formText(data, 'text', 2000), section: formText(data, 'section', 100), concert: formText(data, 'concert', 300) };
		const options = sectionOptions(config);
		const checked = checkNote(input, {
			sections: [...options.sections, ...options.instruments],
			concerts: noteConcerts(library, piece).map((concert) => concert.value)
		});
		if ('problem' in checked) return fail(400, { noteError: t.pieceNotes.problems[checked.problem], noteValues: input });
		try {
			await ensureTab('pieceNotes');
			const table = await readTab('pieceNotes');
			await appendRecords('pieceNotes', table, [
				{
					piece: piece.sheet.title,
					section: checked.values.section,
					concert: checked.values.concert,
					note: checked.values.text,
					by: locals.access.user?.name ?? '',
					at: today(),
					id: newId()
				}
			]);
			await refreshAfterWrite();
		} catch (cause) {
			if (cause instanceof SheetLayoutError) return fail(409, { noteError: t.pieceNotes.notSetUp, noteValues: input });
			console.error('Saving a note on a piece failed:', cause);
			return fail(503, { noteError: t.pieceNotes.failed, noteValues: input });
		}
		return { noteSaved: true };
	},

	deleteNote: async ({ request, locals }) => {
		requireRight(locals, 'programme.bearbeiten');
		const id = formText(await request.formData(), 'id', 40);
		try {
			const table = await readTab('pieceNotes');
			const row = id ? table.rows.find((r) => r.values.id === id) : undefined;
			if (!row) return fail(409, { noteError: t.pieceNotes.gone });
			await deleteRows('pieceNotes', table, [row.row]);
			await refreshAfterWrite();
		} catch (cause) {
			if (cause instanceof SheetLayoutError) return fail(409, { noteError: t.pieceNotes.notSetUp });
			console.error('Deleting a note on a piece failed:', cause);
			return fail(503, { noteError: t.pieceNotes.failed });
		}
		return { noteDeleted: true };
	},
	again: async ({ params, locals }) => {
		const user = feedbackUser(locals);
		if (!isOn('wishes')) return fail(404, { againError: t.wishes.failed });
		if (!user) return fail(403, { againError: t.wishes.signInNeeded });
		const piece = (await getLibrary()).piecesById.get(params.id);
		if (!piece) error(404, t.messages.noPiece);
		try {
			return { againSaved: await playAgain(piece, user) };
		} catch (cause) {
			if (cause instanceof SheetLayoutError) return fail(409, { againError: t.wishes.notSetUp });
			console.error('Saving "Wieder spielen" failed:', cause);
			return fail(503, { againError: t.wishes.failed });
		}
	},

	report: async ({ params, request, locals }) => {
		const user = feedbackUser(locals);
		if (!user) return fail(403, { reportError: t.reports.signInNeeded });
		const data = await request.formData();
		const kind = formText(data, 'kind') as ReportKind;
		if (!REPORT_KINDS.includes(kind)) return fail(400, { reportError: t.reports.failed });

		const piece = (await getLibrary()).piecesById.get(params.id);
		if (!piece?.detail) error(404, t.messages.noPiece);
		// The part's name comes from the archive, not from the form.
		const fileId = formText(data, 'fileId');
		const part = fileId ? piece.detail.parts.find((p) => p.id === fileId) : undefined;
		if (fileId && !part) return fail(400, { reportError: t.reports.unknownPart });
		// A missing part has no file: it's named by instrument and number, from the configured list.
		const instrument = formText(data, 'missingInstrument');
		let missingLabel = '';
		if (kind === 'missing' && !fileId && instrument) {
			if (!playableInstruments(config).includes(instrument)) return fail(400, { reportError: t.reports.unknownPart });
			const number = Number(formText(data, 'missingNumber'));
			missingLabel = formatInstrument({ instrument, numbers: number >= 1 && number <= 8 ? [number] : [] });
		}

		try {
			await addReport(user, {
				pieceId: piece.id,
				pieceName: piece.title,
				part: part?.label ?? missingLabel,
				fileId,
				kind,
				comment: formText(data, 'comment', 1000)
			});
			return { reported: true };
		} catch (cause) {
			if (cause instanceof SheetLayoutError) return fail(409, { reportError: t.reports.notSetUp });
			console.error('Saving a problem report failed:', cause);
			return fail(503, { reportError: t.reports.failed });
		}
	}
};
