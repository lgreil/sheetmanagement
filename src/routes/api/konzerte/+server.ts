import { orchestra } from '#lib/server/env.ts';
import { getLibrary } from '#lib/server/library.ts';
import { publicFeed, publishedIds } from '#lib/server/public-concerts.ts';
import type { RequestHandler } from './$types';

/**
 * Published concerts as JSON for the orchestra's website (#197), without sign-in: `upcoming`
 * for the next dates, `past` for the Chronik. Any site may read it (CORS), since it holds only
 * what an organiser chose to make public.
 */
export const GET: RequestHandler = async () => {
	const [library, published] = await Promise.all([getLibrary(), publishedIds()]);
	const feed = publicFeed(library, published);
	return new Response(JSON.stringify({ orchestra: orchestra().name, ...feed }), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'access-control-allow-origin': '*',
			'cache-control': 'public, max-age=900'
		}
	});
};
