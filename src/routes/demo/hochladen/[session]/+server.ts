import { error, json } from '@sveltejs/kit';
import { finishDemoUpload } from '#lib/server/demo/backend.ts';
import { isDemo } from '#lib/server/env.ts';
import type { RequestHandler } from './$types';

/** Where the demo's uploads go instead of Google (#193). The content isn't kept: a sample PDF stands in. Demo mode only. */
export const PUT: RequestHandler = async ({ params, request }) => {
	if (!isDemo()) error(404, 'Not found');
	await request.arrayBuffer();
	const file = finishDemoUpload(params.session);
	if (!file) error(404, 'Upload not found');
	return json({ ...file, mimeType: 'application/pdf' });
};
