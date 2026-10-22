import { error, json } from '@sveltejs/kit';
import { requireRight } from '#lib/server/auth/index.ts';
import { videoSeconds, youtubeEnabled } from '#lib/server/youtube.ts';
import type { RequestHandler } from './$types';

/** A video's length for the piece editor's suggestions (#133); only for people who edit pieces. */
export const GET: RequestHandler = async ({ params, locals }) => {
	requireRight(locals, 'stuecke.bearbeiten');
	if (!youtubeEnabled()) error(404, 'Ohne YOUTUBE_API_KEY gibt es keine Videolänge.');
	if (!/^[\w-]{11}$/.test(params.id)) error(400, 'Keine YouTube-Video-ID.');
	const seconds = await videoSeconds(params.id).catch((cause) => {
		console.error('YouTube lookup failed:', cause instanceof Error ? cause.message : cause);
		error(502, 'YouTube ist gerade nicht erreichbar.');
	});
	return json({ seconds: seconds ?? null });
};
