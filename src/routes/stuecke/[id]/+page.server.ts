import { error } from '@sveltejs/kit';
import { fileUrl, folderUrl, getCatalog } from '#lib/server/catalog.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const result = await getCatalog();
	if (!result.ok) error(503, 'Das Notenarchiv ist gerade nicht erreichbar.');

	const piece = result.catalog.byId.get(params.id);
	if (!piece) error(404, 'Dieses Stück gibt es nicht (mehr) im Notenarchiv.');

	return {
		piece: {
			...piece,
			folderUrl: folderUrl(piece.id),
			parts: piece.parts.map((part) => ({ ...part, url: fileUrl(part.id, part.mimeType) }))
		}
	};
};
