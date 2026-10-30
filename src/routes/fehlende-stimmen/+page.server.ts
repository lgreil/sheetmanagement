import { fail } from '@sveltejs/kit';
import { t } from '#lib/i18n/index.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { fileUrl } from '#lib/server/catalog.ts';
import { getLibrary } from '#lib/server/library.ts';
import { confirmPartHint, dismissPartHint, getPartHints } from '#lib/server/part-checks.ts';
import { driveWriteEnabled, getArchiveIndex } from '#lib/server/services.ts';
import { isGap, reportedGaps } from '#lib/repertoire/missing-parts.ts';
import { getFeedback, getMissingPartsDone } from '#lib/server/repertoire.ts';
import { readTab, refreshAfterWrite, SheetLayoutError, updateRecord } from '#lib/server/sheet-writes.ts';
import type { Actions, PageServerLoad } from './$types';

const RIGHT = 'stuecke.bearbeiten';

/**
 * Every gap in the archive in one list, generated from the file names (FEHLT, LEER,
 * UNVOLLSTÄNDIG) plus open problem reports. Replaces the hand-kept lists in Drive.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const [library, feedback, done] = await Promise.all([getLibrary(), getFeedback(), getMissingPartsDone()]);
	const openReports = (feedback?.reports ?? []).filter((report) => report.status === 'open');
	// What the completeness check found (#93); the page works without it.
	const catalog = library.catalog;
	const check = catalog.ok
		? await getArchiveIndex()
				.then(({ value }) => getPartHints(catalog.catalog, value))
				.catch((cause) => (console.error('Reading the part check failed:', cause), undefined))
		: undefined;

	const pieces = library.pieces
		.map((piece) => {
			const pieceReports = openReports.filter((report) => report.pieceId === piece.id);
			const reportedFiles = new Set(pieceReports.map((report) => report.fileId));
			const gaps = (piece.detail?.parts ?? []).filter(isGap).map((part) => ({
				id: part.id,
				label: part.label,
				status: part.status,
				url: fileUrl(part.id, part.mimeType),
				// Ticked here or in "Fehlende Stimmen"; stays listed until the file is renamed.
				done: done.has(part.id),
				reported: reportedFiles.has(part.id)
			}));
			// Reports the file name doesn't show yet count with the status they stand for.
			const mimeTypes = new Map((piece.detail?.parts ?? []).map((part) => [part.id, part.mimeType]));
			const reports = reportedGaps(
				gaps.map((gap) => gap.id),
				pieceReports
			).map((report) => ({
				...report,
				url: report.fileId && mimeTypes.has(report.fileId) ? fileUrl(report.fileId, mimeTypes.get(report.fileId)!) : undefined
			}));
			const hints = (piece.detail?.parts ?? []).flatMap((part) => {
				const hint = check?.hints.get(part.id);
				return hint ? [{ ...hint, label: part.label, url: fileUrl(part.id, part.mimeType) }] : [];
			});
			return { id: piece.id, title: piece.title, composer: piece.composer, programs: piece.programs, gaps, reports, hints };
		})
		.filter((piece) => piece.gaps.length || piece.reports.length || piece.hints.length);

	const count = (status: string) =>
		pieces.reduce(
			(sum, piece) =>
				sum + piece.gaps.filter((gap) => gap.status === status).length + piece.reports.filter((report) => report.status === status).length,
			0
		);
	return {
		ok: library.catalog.ok,
		pieces,
		programs: library.catalog.ok ? library.catalog.catalog.programs : [],
		counts: {
			missing: count('missing'),
			empty: count('empty'),
			incomplete: count('incomplete'),
			reports: pieces.reduce((sum, piece) => sum + piece.reports.length, 0),
			hints: pieces.reduce((sum, piece) => sum + piece.hints.length, 0)
		},
		check: check ? { checked: check.checked, total: check.total } : undefined,
		canMark: locals.access.rights.has(RIGHT),
		driveWrite: driveWriteEnabled()
	};
};

/** A hint from the completeness check, confirmed (the file gets the status word) or dismissed. */
export const actions: Actions = {
	/** Ticks a gap off ("erledigt", e.g. ordered) or opens it again; the row comes from the archive sync. */
	markDone: async ({ locals, request }) => {
		requireRight(locals, RIGHT);
		const form = await request.formData();
		const id = String(form.get('id') ?? '').slice(0, 100);
		const done = form.get('done') === 'true';
		const table = await readTab('missingParts').catch((cause) => (cause instanceof SheetLayoutError ? null : Promise.reject(cause)));
		const row = table?.rows.find((r) => r.values.fileId === id);
		if (!table || !row) return fail(404, { message: t.gaps.markGone });
		await updateRecord('missingParts', table, row.row, { done });
		await refreshAfterWrite();
		return { saved: true };
	},
	confirmHint: async ({ locals, request }) => {
		requireRight(locals, RIGHT);
		const id = String((await request.formData()).get('id') ?? '').slice(0, 100);
		try {
			const done = await confirmPartHint(id);
			if (done === undefined) return fail(404, { message: t.gaps.hintGone });
			return done ? { saved: true } : fail(503, { message: t.gaps.hintDriveFailed });
		} catch (cause) {
			console.error('Confirming a part hint failed:', cause);
			return fail(503, { message: t.gaps.hintDriveFailed });
		}
	},
	dismissHint: async ({ locals, request }) => {
		requireRight(locals, RIGHT);
		await dismissPartHint(String((await request.formData()).get('id') ?? '').slice(0, 100));
		return { saved: true };
	}
};
