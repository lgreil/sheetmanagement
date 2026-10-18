import { getCatalog } from '#lib/server/catalog.ts';
import { getRepertoire } from '#lib/server/repertoire.ts';
import { getSchedule } from '#lib/server/schedule.ts';

/**
 * Fills the caches the pages need: Drive index (in KV), calendar (in KV) and the sheet,
 * including adding new pieces and concerts to it. The deploy workflow calls this right
 * after a deploy, so the first visitor doesn't wait while a new INDEX_VERSION crawls
 * Drive (#57). Every step is cached and deduplicated, so calling it again is cheap and
 * it's harmless to leave open; it reports only whether each source loaded.
 */
export async function GET() {
	const started = Date.now();
	const [catalog, schedule, sheet] = await Promise.all([getCatalog(), getSchedule(), getRepertoire()]);
	return Response.json({ archive: catalog.ok, calendar: schedule.ok, sheet: sheet.ok, ms: Date.now() - started });
}
