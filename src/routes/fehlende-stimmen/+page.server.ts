import { fileUrl } from '#lib/server/catalog.ts';
import { getLibrary } from '#lib/server/library.ts';
import { getFeedback } from '#lib/server/repertoire.ts';
import type { PageServerLoad } from './$types';

/**
 * Every gap in the archive in one list, generated from the file names (FEHLT, LEER,
 * UNVOLLSTÄNDIG) plus open problem reports. Replaces the hand-kept lists in Drive.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const [library, feedback] = await Promise.all([getLibrary(), getFeedback()]);
	const openReports = (feedback?.reports ?? []).filter((report) => report.status === 'open');

	const pieces = library.pieces
		.map((piece) => {
			const gaps = (piece.detail?.parts ?? [])
				.filter((part) => part.status !== 'ok' && part.kind !== 'audio' && part.kind !== 'sonstiges')
				.map((part) => ({ id: part.id, label: part.label, status: part.status, url: fileUrl(part.id, part.mimeType) }));
			const reports = openReports
				.filter((report) => report.pieceId === piece.id)
				.map(({ id, part, kind, comment }) => ({ id, part, kind, comment }));
			return { id: piece.id, title: piece.title, composer: piece.composer, programs: piece.programs, gaps, reports };
		})
		.filter((piece) => piece.gaps.length || piece.reports.length);

	const count = (status: string) => pieces.reduce((sum, piece) => sum + piece.gaps.filter((gap) => gap.status === status).length, 0);
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
		canManage: locals.access.rights.has('stuecke.bearbeiten')
	};
};
