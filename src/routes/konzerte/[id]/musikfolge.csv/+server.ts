import { error } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { reportRows, toCsv } from '#lib/repertoire/music-report.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { getLibrary, reportPieces } from '#lib/server/library.ts';
import type { RequestHandler } from './$types';

/** The music list (#118) as a CSV file, to paste into the collecting society's form. */
export const GET: RequestHandler = async ({ params, locals }) => {
	requireRight(locals, 'programme.bearbeiten');
	if (config.musicReport === false) error(404, 'Nicht eingeschaltet.');
	const library = await getLibrary();
	const concert = library.concertsById.get(params.id);
	if (!concert) error(404, 'Dieses Konzert gibt es nicht.');
	const name = `${t.musicReport.title} ${concert.title}`.replace(/[^\p{L}\p{N} ._-]+/gu, '').trim();
	return new Response(toCsv(reportRows(reportPieces(library, concert))), {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="musikfolge.csv"; filename*=UTF-8''${encodeURIComponent(name)}.csv`,
			'cache-control': 'private, no-store'
		}
	});
};
