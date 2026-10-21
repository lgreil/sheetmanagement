import { config, type OrchestraConfig } from '#lib/config/index.ts';
import { linkSources, planSync, toSheetRow, type CalendarConcert, type DrivePiece, type Links } from '#lib/repertoire/link.ts';
import { ACCESS_TABS, buildAccessList, type AccessList, type AccessValues } from '#lib/access/access.ts';
import { buildFeedback, FEEDBACK_TABS, type Feedback, type FeedbackValues } from '#lib/feedback/feedback.ts';
import { readInstrumentGroups, type InstrumentGroups } from '#lib/music/instrument-groups.ts';
import type { PieceDetail } from '#lib/music/types.ts';
import { archiveGaps, doneFileIds, planMissingParts } from '#lib/repertoire/missing-parts.ts';
import { buildSignups, type Signups } from '#lib/signups/signups.ts';
import { buildRehearsalPlan, type RehearsalPlan } from '#lib/rehearsals/plan.ts';
import { buildLoans, type Loans } from '#lib/loans/loans.ts';
import { buildAttendance, type Attendance } from '#lib/attendance/attendance.ts';
import { buildRepertoire, LAYOUT, REPERTOIRE_TABS, type Repertoire, type SheetValues, type TabKey } from '#lib/repertoire/sheet.ts';
import { cached } from './cache.ts';
import { getCatalog } from './catalog.ts';
import { appEnv, runInBackground } from './env.ts';
import type { GoogleClient } from './google/client.ts';
import { appendRows, getSpreadsheetInfo, getValues, tabRange } from './google/sheets.ts';
import { getSchedule } from './schedule.ts';
import { getGoogle, NotConfiguredError, requireSetting } from './services.ts';
import { replaceRows } from './sheet-writes.ts';

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
): Promise<{
	values: SheetValues;
	access: AccessValues;
	feedback: FeedbackValues;
	missingParts?: string[][];
	instrumentGroups?: string[][];
	signups?: string[][];
	rehearsals?: string[][];
	loans?: string[][];
	attendance?: string[][];
}> {
	const info = await getSpreadsheetInfo(client, spreadsheetId);
	const missing = REPERTOIRE_TABS.map((key) => LAYOUT[key].tab).filter((tab) => !info.tabs.includes(tab));
	if (missing.length) throw new SheetNotSetUpError(missing);
	const optional = ([...ACCESS_TABS, ...FEEDBACK_TABS, 'missingParts', 'instrumentGroups', 'signups', 'rehearsals', 'loans', 'attendance'] as const).filter((key) =>
		info.tabs.includes(LAYOUT[key].tab)
	);
	const keys = [...REPERTOIRE_TABS, ...optional];
	const ranges = keys.map((key) => tabRange(LAYOUT[key].tab));
	const result = await getValues(client, spreadsheetId, ranges);
	const all = Object.fromEntries(keys.map((key, i) => [key, result[ranges[i]]])) as Record<TabKey, string[][]>;
	const { pieces, concerts, program, reports, wishes, missingParts, instrumentGroups, signups, rehearsals, loans, attendance, ...access } = all;
	return {
		values: { pieces, concerts, program },
		access,
		feedback: { reports, wishes },
		missingParts,
		instrumentGroups,
		signups,
		rehearsals,
		loans,
		attendance
	};
}

export interface Sources {
	drivePieces: DrivePiece[];
	calendarConcerts: CalendarConcert[];
}

/** Drive pieces and calendar concerts as far as they load; a failing source is just empty. */
async function loadSources(): Promise<Sources & { complete: boolean; archive: PieceDetail[] | null }> {
	const [catalog, schedule] = await Promise.all([getCatalog(), getSchedule()]);
	return {
		complete: catalog.ok && schedule.ok,
		archive: catalog.ok ? catalog.catalog.pieces : null,
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

/**
 * Mirrors the archive's gaps into "Fehlende Stimmen": one write, only when something
 * changed. Returns whether anything was written.
 */
async function syncMissingParts(values: string[][], archive: PieceDetail[], links: Links): Promise<boolean> {
	const gaps = archiveGaps(archive, (id) => links.pieceByFolder.get(id)?.title);
	const plan = planMissingParts(values, gaps);
	if (!plan.ok || !plan.changed) return false;
	await replaceRows('missingParts', plan.body);
	return true;
}

export type RepertoireResult =
	| { ok: true; repertoire: Repertoire; links: Links; storedAt: number }
	| { ok: false; reason: 'not-configured' | 'not-set-up' | 'failed'; missingTabs?: string[] };

type RawSheet = Awaited<ReturnType<typeof readSheet>>;

interface SheetSnapshot {
	repertoire: Repertoire;
	access: AccessList;
	feedback: Feedback;
	/** File ids ticked "erledigt" in "Fehlende Stimmen". */
	missingPartsDone: string[];
	/** null: the tab is missing or empty, so the preset's groups apply. */
	instrumentGroups: InstrumentGroups | null;
	/** null: the "Anmeldungen" tab is missing. */
	signups: Signups | null;
	/** null: the "Proben" tab is missing. */
	rehearsals: RehearsalPlan | null;
	/** null: the "Leihmaterial" tab is missing. */
	loans: Loans | null;
	/** null: the "Anwesenheit" tab is missing. */
	attendance: Attendance | null;
}

/**
 * The sheet as read, in memory and KV. KV lets a new Worker instance check who's a
 * member without waiting for Google, which matters most right after signing in. It's
 * only written when the sheet changed, so the free tier's 1,000 writes a day last.
 */
function loadRawSheet(force: boolean) {
	const spreadsheetId = requireSetting('REPERTOIRE_SHEET_ID');
	const { client } = getGoogle();
	return cached<RawSheet>({
		key: `sheet:v1:${spreadsheetId}`,
		maxAgeMs: SHEET_MAX_AGE_MS,
		build: () => readSheet(client, spreadsheetId),
		kv: appEnv().CACHE,
		waitUntil: runInBackground,
		force
	});
}

// Built once per sheet snapshot and Worker instance, not on every request.
const snapshots = new WeakMap<RawSheet, SheetSnapshot>();

async function loadSheet(force: boolean): Promise<{ value: SheetSnapshot; sheet: RawSheet; storedAt: number }> {
	const { value: sheet, storedAt } = await loadRawSheet(force);
	let snapshot = snapshots.get(sheet);
	if (!snapshot) {
		snapshot = {
			repertoire: buildRepertoire(sheet.values),
			access: buildAccessList(sheet.access),
			feedback: buildFeedback(sheet.feedback),
			missingPartsDone: doneFileIds(sheet.missingParts ?? []),
			instrumentGroups: readInstrumentGroups(
				sheet.instrumentGroups,
				config.instruments.map((instrument) => instrument.name)
			),
			signups: sheet.signups ? buildSignups(sheet.signups) : null,
			rehearsals: sheet.rehearsals ? buildRehearsalPlan(sheet.rehearsals) : null,
			loans: sheet.loans ? buildLoans(sheet.loans) : null,
			attendance: sheet.attendance ? buildAttendance(sheet.attendance) : null
		};
		snapshots.set(sheet, snapshot);
	}
	return { value: snapshot, sheet, storedAt };
}

/** Adding new pieces and concerts runs this often at most, per Worker instance. */
const SYNC_INTERVAL_MS = 5 * 60 * 1000;
/** After a failed write (probably read-only access to the sheet), wait longer. */
const SYNC_BACKOFF_MS = 30 * 60 * 1000;
let nextSync = 0;

/**
 * Adds new Drive folders and calendar concerts to the sheet and mirrors the archive's
 * gaps into "Fehlende Stimmen". Runs after the response, so no page waits for writes.
 */
function syncInBackground() {
	if (Date.now() < nextSync) return;
	nextSync = Date.now() + SYNC_INTERVAL_MS;
	const sync = async () => {
		// Syncing needs both sources, otherwise rows the sheet already has look new.
		const sources = await loadSources();
		if (!sources.complete) return;
		// A fresh read: in a cached copy, rows added meanwhile would look missing and be added twice.
		const {
			value: { repertoire },
			sheet: { missingParts }
		} = await loadSheet(true);
		const { client } = getGoogle();
		const spreadsheetId = requireSetting('REPERTOIRE_SHEET_ID');
		let wrote = await syncSheet(client, spreadsheetId, repertoire, sources);
		// Without the archive every row would look gone, so it waits for Drive.
		if (missingParts && sources.archive) {
			const links = linkSources(repertoire, sources.drivePieces, sources.calendarConcerts, config.timeZone);
			wrote = (await syncMissingParts(missingParts, sources.archive, links)) || wrote;
		}
		if (wrote) await loadRawSheet(true);
	};
	runInBackground(
		sync().catch((error) => {
			nextSync = Date.now() + SYNC_BACKOFF_MS;
			console.error('Updating the sheet from Drive and the calendar failed:', error);
		})
	);
}

export async function getRepertoire({ force = false } = {}): Promise<RepertoireResult> {
	try {
		const [{ value, storedAt }, sources] = await Promise.all([loadSheet(force), loadSources()]);
		syncInBackground();
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
	return (await readAccessList({ force })).list;
}

/** Like getAccessList, but tells a sheet that isn't set up apart from one that failed to load. */
export async function readAccessList({ force = false } = {}): Promise<{ list: AccessList | null; failed: boolean }> {
	try {
		return { list: (await loadSheet(force)).value.access, failed: false };
	} catch (error) {
		if (error instanceof NotConfiguredError || error instanceof SheetNotSetUpError) return { list: null, failed: false };
		console.error('Loading the member list failed:', error);
		return { list: null, failed: true };
	}
}

/** The groups from "Instrumentgruppen"; null when the tab is missing, empty or unreadable. */
export async function getInstrumentGroups({ force = false } = {}): Promise<InstrumentGroups | null> {
	try {
		return (await loadSheet(force)).value.instrumentGroups;
	} catch {
		// getLibrary already logs why the sheet failed.
		return null;
	}
}

/** The config with the orchestra's own instrument groups from the sheet, if it has any. */
export async function getMusicConfig(): Promise<OrchestraConfig> {
	const groups = await getInstrumentGroups();
	return groups ? { ...config, sharedParts: groups.sharedParts } : config;
}

/** File ids ticked "erledigt" in "Fehlende Stimmen"; empty when the sheet can't be read. */
export async function getMissingPartsDone(): Promise<Set<string>> {
	try {
		return new Set((await loadSheet(false)).value.missingPartsDone);
	} catch {
		// getLibrary already logs why the sheet failed.
		return new Set();
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

/** Sign-ups for rehearsals and concerts; null when the tab is missing or the sheet can't be read. */
export async function getSignups({ force = false } = {}): Promise<Signups | null> {
	try {
		return (await loadSheet(force)).value.signups;
	} catch {
		// getLibrary already logs why the sheet failed.
		return null;
	}
}

/** The rehearsal plan; null when the tab is missing or the sheet can't be read. */
export async function getRehearsalPlan({ force = false } = {}): Promise<RehearsalPlan | null> {
	try {
		return (await loadSheet(force)).value.rehearsals;
	} catch {
		// getLibrary already logs why the sheet failed.
		return null;
	}
}

/** Rented and borrowed music; null when the tab is missing or the sheet can't be read. */
export async function getLoans({ force = false } = {}): Promise<Loans | null> {
	try {
		return (await loadSheet(force)).value.loans;
	} catch {
		// getLibrary already logs why the sheet failed.
		return null;
	}
}

/** Who came to which rehearsal; null when the tab is missing or the sheet can't be read. */
export async function getAttendance({ force = false } = {}): Promise<Attendance | null> {
	try {
		return (await loadSheet(force)).value.attendance;
	} catch {
		// getLibrary already logs why the sheet failed.
		return null;
	}
}
