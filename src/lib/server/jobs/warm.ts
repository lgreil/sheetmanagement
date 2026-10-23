import { t } from '#lib/i18n/index.ts';
import { getCatalog } from '../catalog.ts';
import { getRepertoire } from '../repertoire.ts';
import { getSchedule } from '../schedule.ts';
import type { JobResult } from './index.ts';

/**
 * Fills the caches the pages need: Drive index (in KV), calendar (in KV) and the sheet,
 * including adding new pieces and concerts to it. Every step is cached and deduplicated,
 * so running it often is cheap: a stale value is refreshed, a fresh one left alone.
 */
export async function warmCaches(): Promise<JobResult & { sources: { archive: boolean; calendar: boolean; sheet: boolean } }> {
	const [catalog, schedule, sheet] = await Promise.all([getCatalog(), getSchedule(), getRepertoire()]);
	const sources = { archive: catalog.ok, calendar: schedule.ok, sheet: sheet.ok };
	const failed = (Object.keys(sources) as (keyof typeof sources)[]).filter((key) => !sources[key]).map((key) => t.status.warmSources[key]);
	return { ok: !failed.length, summary: failed.length ? t.status.warmFailed(failed.join(', ')) : t.status.warmDone, sources };
}
