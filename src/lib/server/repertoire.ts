import { config } from '#lib/config/index.ts';
import { linkSources, planSync, toSheetRow, type CalendarConcert, type DrivePiece, type Links } from '#lib/repertoire/link.ts';
import { buildRepertoire, LAYOUT, type Repertoire, type SheetValues, type TabKey } from '#lib/repertoire/sheet.ts';
import { cached } from './cache.ts';
import { getCatalog } from './catalog.ts';
import { runInBackground } from './env.ts';
import type { GoogleClient } from './google/client.ts';
import { appendRows, getSpreadsheetInfo, getValues, tabRange } from './google/sheets.ts';
import { getSchedule } from './schedule.ts';
import { getGoogle, NotConfiguredError, requireSetting } from './services.ts';

/** People edit the sheet by hand, so changes should show up quickly. */
const SHEET_MAX_AGE_MS = 60 * 1000;
const TAB_KEYS = Object.keys(LAYOUT) as TabKey[];

/** The sheet exists but /setup hasn't created all tabs yet. */
export class SheetNotSetUpError extends Error {
	constructor(readonly missingTabs: string[]) {
		super(`Missing tabs: ${missingTabs.join(', ')}`);
		this.name = 'SheetNotSetUpError';
	}
}

export async function readSheet(client: GoogleClient, spreadsheetId: string): Promise<SheetValues> {
	const info = await getSpreadsheetInfo(client, spreadsheetId);
	const missing = TAB_KEYS.map((key) => LAYOUT[key].tab).filter((tab) => !info.tabs.includes(tab));
	if (missing.length) throw new SheetNotSetUpError(missing);
	const ranges = TAB_KEYS.map((key) => tabRange(LAYOUT[key].tab));
	const values = await getValues(client, spreadsheetId, ranges);
	return Object.fromEntries(TAB_KEYS.map((key, i) => [key, values[ranges[i]]])) as SheetValues;
}

export interface Sources {
	drivePieces: DrivePiece[];
	calendarConcerts: CalendarConcert[];
}

/** Drive pieces and calendar concerts as far as they load; a failing source is just empty. */
async function loadSources(): Promise<Sources & { complete: boolean }> {
	const [catalog, schedule] = await Promise.all([getCatalog(), getSchedule()]);
	return {
		complete: catalog.ok && schedule.ok,
		drivePieces: catalog.ok
			? catalog.catalog.pieces.map(({ id, title, composer, catalogue, folderName }) => ({ id, title, composer, catalogue, folderName }))
			: [],
		calendarConcerts: schedule.ok ? schedule.events.filter((event) => event.type === 'konzert') : []
	};
}

/**
 * Appends rows for new Drive folders and calendar concerts. Only adds, never changes
 * or removes rows. Returns whether anything was written.
 */
async function syncSheet(client: GoogleClient, spreadsheetId: string, repertoire: Repertoire, sources: Sources) {
	const links = linkSources(repertoire, sources.drivePieces, sources.calendarConcerts, config.timeZone);
	const plan = planSync(repertoire, links, sources.drivePieces, sources.calendarConcerts, {
		timeZone: config.timeZone,
		orchestra: config.orchestras[0]
	});
	const { pieces, concerts } = repertoire.tables;
	// Without its id column a tab can't be synced: the next run would add everything again.
	const canWrite = (table: { missing: string[] }, id: string) => !table.missing.includes(id);
	let wrote = false;
	if (plan.pieces.length && canWrite(pieces, 'driveFolderId')) {
		await appendRows(client, spreadsheetId, tabRange(LAYOUT.pieces.tab), plan.pieces.map((row) => toSheetRow(row, pieces.indexes)));
		wrote = true;
	}
	if (plan.concerts.length && canWrite(concerts, 'eventId')) {
		await appendRows(client, spreadsheetId, tabRange(LAYOUT.concerts.tab), plan.concerts.map((row) => toSheetRow(row, concerts.indexes)));
		wrote = true;
	}
	return wrote;
}

export type RepertoireResult =
	| { ok: true; repertoire: Repertoire; links: Links; storedAt: number }
	| { ok: false; reason: 'not-configured' | 'not-set-up' | 'failed'; missingTabs?: string[] };

let lastSyncFailure = 0;

export async function getRepertoire({ force = false } = {}): Promise<RepertoireResult> {
	try {
		const spreadsheetId = requireSetting('REPERTOIRE_SHEET_ID');
		const { client } = getGoogle();
		const [{ value: repertoire, storedAt }, sources] = await Promise.all([
			cached({
				key: `repertoire:v1:${spreadsheetId}`,
				maxAgeMs: SHEET_MAX_AGE_MS,
				// Memory only: a KV write per minute would use up the free tier's 1,000 writes a day.
				build: async () => {
					const values = await readSheet(client, spreadsheetId);
					let repertoire = buildRepertoire(values);
					// Syncing needs both sources, otherwise rows the sheet already has look new.
					const sources = await loadSources();
					if (sources.complete && Date.now() - lastSyncFailure > 10 * SHEET_MAX_AGE_MS) {
						try {
							if (await syncSheet(client, spreadsheetId, repertoire, sources)) {
								repertoire = buildRepertoire(await readSheet(client, spreadsheetId));
							}
						} catch (error) {
							// Probably read-only access to the sheet. Reading still works; retry later.
							lastSyncFailure = Date.now();
							console.error('Adding new pieces and concerts to the sheet failed:', error);
						}
					}
					return repertoire;
				},
				waitUntil: runInBackground,
				force
			}),
			loadSources()
		]);
		const links = linkSources(repertoire, sources.drivePieces, sources.calendarConcerts, config.timeZone);
		return { ok: true, repertoire, links, storedAt };
	} catch (error) {
		if (error instanceof NotConfiguredError) return { ok: false, reason: 'not-configured' };
		if (error instanceof SheetNotSetUpError) return { ok: false, reason: 'not-set-up', missingTabs: error.missingTabs };
		console.error('Loading the Repertoire sheet failed:', error);
		return { ok: false, reason: 'failed' };
	}
}
