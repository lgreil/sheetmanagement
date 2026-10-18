import { error } from '@sveltejs/kit';
import type { Catalog } from '#lib/music/catalog.ts';
import { getCatalog } from '#lib/server/catalog.ts';
import { downloadFile } from '#lib/server/google/drive.ts';
import { getGoogle } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

const PDF = 'application/pdf';

// The PDFs of the archive, per catalog snapshot, so a lookup is one Set.has.
const pdfIds = new WeakMap<Catalog, Set<string>>();
function archivePdfs(catalog: Catalog): Set<string> {
	let ids = pdfIds.get(catalog);
	if (!ids) {
		ids = new Set(catalog.pieces.flatMap((piece) => piece.parts.filter((part) => part.mimeType === PDF).map((part) => part.id)));
		pdfIds.set(catalog, ids);
	}
	return ids;
}

/**
 * One part's PDF, fetched by the service account, so "Meine Noten" can merge a
 * member's parts in the browser. Only for signed-in members (with sign-in off the app
 * is public, and the PDFs must stay behind Drive's own sharing), and only for PDFs that
 * are in the archive, never any other file the service account can see.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (locals.auth !== 'on' || !locals.access.member) error(403, 'Nur für angemeldete Mitglieder.');
	const catalog = await getCatalog();
	if (!catalog.ok) error(503, 'Das Notenarchiv ist gerade nicht erreichbar.');
	if (!archivePdfs(catalog.catalog).has(params.id)) error(404, 'Diese Datei gibt es nicht im Notenarchiv.');

	const file = await downloadFile(getGoogle().client, params.id).catch((cause) => {
		console.error('Downloading a part failed:', cause);
		error(502, 'Die Datei konnte gerade nicht aus Drive geladen werden.');
	});
	return new Response(file.body, {
		headers: {
			'content-type': PDF,
			// Members only: never in a shared cache.
			'cache-control': 'private, max-age=600',
			'x-content-type-options': 'nosniff'
		}
	});
};
