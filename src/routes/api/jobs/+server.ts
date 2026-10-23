import { isDemo } from '#lib/server/env.ts';
import { runDueJobs } from '#lib/server/jobs/index.ts';
import { isScheduledCall } from '#lib/server/jobs/token.ts';

/**
 * Called by the Cron Trigger from inside the worker (src/worker/scheduled.ts), never from
 * outside: without the handler's one-time token it answers 403. The demo runs jobs only by
 * hand on /status.
 */
export async function POST({ request }) {
	if (!isScheduledCall(request)) return new Response('Forbidden', { status: 403 });
	if (isDemo()) return Response.json({ skipped: 'demo' });
	return Response.json(await runDueJobs());
}
