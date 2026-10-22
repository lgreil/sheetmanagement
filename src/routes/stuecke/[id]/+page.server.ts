import { error, fail } from '@sveltejs/kit';
import { REPORT_KINDS, type ReportKind } from '#lib/feedback/feedback.ts';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { commonInstruments, formatInstrument, playableInstruments } from '#lib/music/my-parts.ts';
import { addReport, feedbackUser, formText, playAgain } from '#lib/server/feedback.ts';
import { features, isOn } from '#lib/server/env.ts';
import { getFeedback, getLoans, getRehearsalPlan } from '#lib/server/repertoire.ts';
import { daysUntilDue, loanState, loansOf } from '#lib/loans/loans.ts';
import { formatDay } from '#lib/events/format.ts';
import { SheetLayoutError } from '#lib/server/sheet-writes.ts';
import { folderUrl, partUrl } from '#lib/server/catalog.ts';
import { listsOverlap } from '#lib/repertoire/lists.ts';
import { workKey } from '#lib/music/piece-name.ts';
import { formatDuration } from '#lib/repertoire/duration.ts';
import { concertSummary, getLibrary, namedItem, type Library, type LibraryPiece } from '#lib/server/library.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const on = features();
	const [library, feedback, plan, loans] = await Promise.all([getLibrary(), getFeedback(), getRehearsalPlan(), on.loans ? getLoans() : null]);
	const piece = library.piecesById.get(params.id);
	if (!piece) {
		if (!library.catalog.ok) error(503, 'Das Notenarchiv ist gerade nicht erreichbar.');
		error(404, 'Dieses Stück gibt es nicht (mehr) im Notenarchiv.');
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
	return {
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
		sheet: library.sheet
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

/** Shares a composer: "Mozart, Haydn" and "Haydn" do. */
const sameComposer = listsOverlap;

const summary = ({ id, title, catalogue, status, programs }: LibraryPiece) => ({ id, title, catalogue, status, programs });

export const actions: Actions = {
	again: async ({ params, locals }) => {
		const user = feedbackUser(locals);
		if (!isOn('wishes')) return fail(404, { againError: t.wishes.failed });
		if (!user) return fail(403, { againError: t.wishes.signInNeeded });
		const piece = (await getLibrary()).piecesById.get(params.id);
		if (!piece) error(404, 'Dieses Stück gibt es nicht (mehr) im Notenarchiv.');
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
		if (!piece?.detail) error(404, 'Dieses Stück gibt es nicht (mehr) im Notenarchiv.');
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
