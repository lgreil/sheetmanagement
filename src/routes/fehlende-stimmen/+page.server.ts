import { fileUrl } from '#lib/server/catalog.ts';
import { getLibrary } from '#lib/server/library.ts';
import { isGap, reportedGaps } from '#lib/repertoire/missing-parts.ts';
import { getFeedback, getMissingPartsDone } from '#lib/server/repertoire.ts';
import type { PageServerLoad } from './$types';

/**
 * Every gap in the archive in one list, generated from the file names (FEHLT, LEER,
 * UNVOLLSTÄNDIG) plus open problem reports. Replaces the hand-kept lists in Drive.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const [library, feedback, done] = await Promise.all([getLibrary(), getFeedback(), getMissingPartsDone()]);
	const openReports = (feedback?.reports ?? []).filter((report) => report.status === 'open');

	const pieces = library.pieces
		.map((piece) => {
			const pieceReports = openReports.filter((report) => report.pieceId === piece.id);
			const reportedFiles = new Set(pieceReports.map((report) => report.fileId));
			const gaps = (piece.detail?.parts ?? []).filter(isGap).map((part) => ({
				id: part.id,
				label: part.label,
				status: part.status,
				url: fileUrl(part.id, part.mimeType),
				// Ticked in the sheet tab "Fehlende Stimmen"; stays listed until the file is renamed.
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
			return { id: piece.id, title: piece.title, composer: piece.composer, programs: piece.programs, gaps, reports };
		})
		.filter((piece) => piece.gaps.length || piece.reports.length);

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
			reports: pieces.reduce((sum, piece) => sum + piece.reports.length, 0)
		},
	};
};
