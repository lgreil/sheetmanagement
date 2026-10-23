import { warmCaches } from '#lib/server/jobs/warm.ts';

/**
 * Fills the caches right after a deploy, so the first visitor doesn't wait while a new
 * INDEX_VERSION crawls Drive (#57); the smoke test in the deploy workflow calls it. The
 * same work runs every few minutes as the "warm" job (#160). Cheap to call again and
 * harmless to leave open; it reports only whether each source loaded.
 */
export async function GET() {
	const started = Date.now();
	const { sources } = await warmCaches();
	return Response.json({ ...sources, ms: Date.now() - started });
}
