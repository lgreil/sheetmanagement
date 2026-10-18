import { config } from '#lib/config/index.ts';
import { linkSources, planSync, toSheetRow, type CalendarConcert, type DrivePiece, type Links } from '#lib/repertoire/link.ts';
import { ACCESS_TABS, buildAccessList, type AccessList, type AccessValues } from '#lib/access/access.ts';
import { buildFeedback, FEEDBACK_TABS, type Feedback, type FeedbackValues } from '#lib/feedback/feedback.ts';
import { buildRepertoire, LAYOUT, REPERTOIRE_TABS, type Repertoire, type SheetValues, type TabKey } from '#lib/repertoire/sheet.ts';
import { cached } from './cache.ts';
import { getCatalog } from './catalog.ts';
import { runInBackground } from './env.ts';
import type { GoogleClient } from './google/client.ts';
import { appendRows, getSpreadsheetInfo, getValues, tabRange } from './google/sheets.ts';
import { getSchedule } from './schedule.ts';
import { getGoogle, NotConfiguredError, requireSetting } from './services.ts';

/** People edit the sheet by hand, so changes should show up quickly. */
const SHEET_MAX_AGE_MS = 60 * 1000;

/** The sheet exists but /setup hasn't created the repertoire tabs yet. */
export class SheetNotSetUpError extends Error {
	constructor(readonly missingTabs: string[]) {
		super(`Missing tabs: ${missingTabs.join(', ')}`);
		this.name = 'SheetNotSetUpError';
	}
}

/**
 * Reads all tabs in one request. The repertoire tabs are required; the access and
 * feedback tabs are read when present, so an older sheet keeps working.
 */
export async function readSheet(
	client: GoogleClient,
	spreadsheetId: string
): Promise<{ values: SheetValues; access: AccessValues; feedback: FeedbackValues }> {
	const info = await getSpreadsheetInfo(client, spreadsheetId);
	const missing = REPERTOIRE_TABS.map((key) => LAYOUT[key].tab).filter((tab) => !info.tabs.includes(tab));
	if (missing.length) throw new SheetNotSetUpError(missing);
	const optional = [...ACCESS_TABS, ...FEEDBACK_TABS].filter((key) => info.tabs.includes(LAYOUT[key].tab));
	const keys = [...REPERTOIRE_TABS, ...optional];
	const ranges = keys.map((key) => tabRange(LAYOUT[key].tab));
	const result = await getValues(client, spreadsheetId, ranges);
	const all = Object.fromEntries(keys.map((key, i) => [key, result[ranges[i]]])) as Record<TabKey, string[][]>;
	const { pieces, concerts, program, reports, wishes, ...access } = all;
	return { values: { pieces, concerts, program }, access, feedback: { reports, wishes } };
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

interface SheetSnapshot {
	repertoire: Repertoire;
	access: AccessList;
	feedback: Feedback;
}

function loadSheet(force: boolean) {
	const spreadsheetId = requireSetting('REPERTOIRE_SHEET_ID');
	const { client } = getGoogle();
	return cached<SheetSnapshot>({
		key: `repertoire:v3:${spreadsheetId}`,
		maxAgeMs: SHEET_MAX_AGE_MS,
		// Memory only: a KV write per minute would use up the free tier's 1,000 writes a day.
		build: async () => {
			let sheet = await readSheet(client, spreadsheetId);
			let repertoire = buildRepertoire(sheet.values);
			// Syncing needs both sources, otherwise rows the sheet already has look new.
			const sources = await loadSources();
			if (sources.complete && Date.now() - lastSyncFailure > 10 * SHEET_MAX_AGE_MS) {
				try {
					if (await syncSheet(client, spreadsheetId, repertoire, sources)) {
						sheet = await readSheet(client, spreadsheetId);
						repertoire = buildRepertoire(sheet.values);
					}
				} catch (error) {
					// Probably read-only access to the sheet. Reading still works; retry later.
					lastSyncFailure = Date.now();
					console.error('Adding new pieces and concerts to the sheet failed:', error);
				}
			}
			return { repertoire, access: buildAccessList(sheet.access), feedback: buildFeedback(sheet.feedback) };
		},
		waitUntil: runInBackground,
		force
	});
}

export async function getRepertoire({ force = false } = {}): Promise<RepertoireResult> {
	try {
		const [{ value, storedAt }, sources] = await Promise.all([loadSheet(force), loadSources()]);
		const links = linkSources(value.repertoire, sources.drivePieces, sources.calendarConcerts, config.timeZone);
		return { ok: true, repertoire: value.repertoire, links, storedAt };
	} catch (error) {
		if (error instanceof NotConfiguredError) return { ok: false, reason: 'not-configured' };
		if (error instanceof SheetNotSetUpError) return { ok: false, reason: 'not-set-up', missingTabs: error.missingTabs };
		console.error('Loading the Repertoire sheet failed:', error);
		return { ok: false, reason: 'failed' };
	}
}

/** Members, groups, rights and access requests; null when the sheet can't be read. */
export async function getAccessList({ force = false } = {}): Promise<AccessList | null> {
	try {
		return (await loadSheet(force)).value.access;
	} catch (error) {
		if (!(error instanceof NotConfiguredError) && !(error instanceof SheetNotSetUpError)) {
			console.error('Loading the member list failed:', error);
		}
		return null;
	}
}

/** Problem reports and wishes; null when the sheet can't be read. */
export async function getFeedback({ force = false } = {}): Promise<Feedback | null> {
	try {
		return (await loadSheet(force)).value.feedback;
	} catch (error) {
		if (!(error instanceof NotConfiguredError) && !(error instanceof SheetNotSetUpError)) {
			console.error('Loading reports and wishes failed:', error);
		}
		return null;
	}
}
