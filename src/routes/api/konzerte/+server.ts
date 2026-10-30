import { orchestra } from '#lib/server/env.ts';
import { getLibrary } from '#lib/server/library.ts';
import { FEED_VERSION, publicDetails, publicFeed, publishedIds } from '#lib/server/public-concerts.ts';
import type { RequestHandler } from './$types';

/**
 * Published concerts as JSON for the orchestra's website (#197), without sign-in: `upcoming`
 * for the next dates, `past` for the Chronik. Any site may read it (CORS), since it holds only
 * what an organiser chose to make public.
 */
export const GET: RequestHandler = async () => {
	const [library, published, details] = await Promise.all([getLibrary(), publishedIds(), publicDetails()]);
	const feed = publicFeed(library, published, details);
	return new Response(JSON.stringify({ version: FEED_VERSION, orchestra: orchestra().name, ...feed }), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'access-control-allow-origin': '*',
			'cache-control': 'public, max-age=900'
		}
	});
};
