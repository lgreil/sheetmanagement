import { config } from '#lib/config/index.ts';
import type { ShownEvent } from '#lib/events/schedule.ts';
import type { Catalog } from '#lib/music/catalog.ts';
import { searchText } from '#lib/music/text.ts';
import type { PieceDetail, PieceStatus, PieceSummary } from '#lib/music/types.ts';
import { eventDay, formatFuzzyDate, fuzzyDateKey, parseFuzzyDate, type FuzzyDate, type FuzzyDateLabel } from '#lib/repertoire/dates.ts';
import type { SheetConcert, SheetPiece } from '#lib/repertoire/sheet.ts';
import { getCatalog } from './catalog.ts';
import { getRepertoire, type RepertoireResult } from './repertoire.ts';
import { getSchedule, type ScheduleResult } from './schedule.ts';

export interface LibraryPiece extends PieceSummary {
	/** Parts and folder, for pieces with sheet music in Drive. */
	detail?: PieceDetail;
	sheet?: SheetPiece;
	/** Ids of the concerts it was played at, oldest first. */
	playedAt: string[];
}

export interface ProgramItem {
	position?: number;
	title: string;
	subtitle?: string;
	/** Link target, when the name matches a piece. */
	pieceId?: string;
	status?: PieceStatus;
	notes?: string;
}

export interface LibraryConcert {
	/** The calendar event id when there is one, so /konzerte/[id] stays the same. */
	id: string;
	title: string;
	date: FuzzyDate | null;
	/** Sortable "1957-12", empty when unknown (sorts last, newest first). */
	dateKey: string;
	label: FuzzyDateLabel | null;
	/** As entered in the sheet, for dates that couldn't be read. */
	dateText?: string;
	location?: string;
	orchestra?: string;
	event?: ShownEvent;
	sheet?: SheetConcert;
	program: ProgramItem[];
}

export type SheetState = 'ok' | Extract<RepertoireResult, { ok: false }>['reason'];

export interface Library {
	catalog: { ok: true; catalog: Catalog } | { ok: false; reason: 'not-configured' | 'failed' };
	schedule: ScheduleResult;
	sheet: SheetState;
	pieces: LibraryPiece[];
	piecesById: Map<string, LibraryPiece>;
	/** Newest first. */
	concerts: LibraryConcert[];
	concertsById: Map<string, LibraryConcert>;
	/** Today in the orchestra's time zone, e.g. "2026-10-18". */
	today: string;
}

const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });

/** Drive archive, calendar and Repertoire sheet combined, as the pages show them. */
export async function getLibrary(now = Date.now()): Promise<Library> {
	const [catalog, schedule, repertoire] = await Promise.all([getCatalog(), getSchedule(now), getRepertoire()]);
	const today = eventDay({ start: new Date(now).toISOString(), allDay: false }, config.timeZone);
	const sheet = repertoire.ok ? repertoire.repertoire : undefined;
	const links = repertoire.ok ? repertoire.links : undefined;

	// Pieces: everything in Drive, with names corrected in the sheet, plus sheet-only pieces.
	const pieces: LibraryPiece[] = [];
	const idBySheetKey = new Map<string, string>();
	for (const detail of catalog.ok ? catalog.catalog.pieces : []) {
		const row = links?.pieceByFolder.get(detail.id);
		if (row) idBySheetKey.set(row.key, detail.id);
		const title = row?.title || detail.title;
		const composer = row?.composer ?? detail.composer;
		const catalogue = row?.catalogue ?? detail.catalogue;
		pieces.push({
			...summary(detail),
			title,
			composer,
			catalogue,
			search: searchText(title, composer, catalogue, row?.arranger, row?.genre, detail.search),
			detail,
			sheet: row,
			playedAt: []
		});
	}
	for (const row of sheet?.pieces ?? []) {
		if (idBySheetKey.has(row.key) || row.driveFolderId || !row.title) continue;
		idBySheetKey.set(row.key, row.key);
		pieces.push({
			id: row.key,
			title: row.title,
			composer: row.composer,
			catalogue: row.catalogue,
			programs: [],
			partCount: 0,
			status: 'none',
			search: searchText(row.title, row.composer, row.catalogue, row.arranger, row.genre),
			sheet: row,
			playedAt: []
		});
	}
	pieces.sort((a, b) => collator.compare(a.title, b.title));
	const piecesById = new Map(pieces.map((piece) => [piece.id, piece]));

	// Concerts: every row in the sheet, plus calendar concerts not in it (yet).
	const events = schedule.ok ? schedule.byId : new Map<string, ShownEvent>();
	const concerts: LibraryConcert[] = [];
	for (const row of sheet?.concerts ?? []) {
		const eventId = links?.eventByConcert.get(row.key) ?? row.eventId;
		const event = eventId ? events.get(eventId) : undefined;
		concerts.push(
			concert({
				// An id from the sheet whose event is gone (or outside the loaded range) keeps it,
				// so links stay stable; the page then shows the sheet's data.
				id: eventId ?? row.key,
				title: event?.displayTitle ?? row.title,
				date: event ? eventDate(event) : row.date,
				dateText: row.dateText,
				location: event?.location ?? row.location,
				orchestra: row.orchestra,
				event,
				sheet: row,
				program: row.program.map((entry) => {
					const piece = entry.pieceKey ? piecesById.get(idBySheetKey.get(entry.pieceKey) ?? '') : undefined;
					return {
						position: entry.position,
						title: piece?.title ?? entry.pieceName,
						subtitle: piece ? [piece.composer, piece.catalogue].filter(Boolean).join(' · ') || undefined : undefined,
						pieceId: piece?.id,
						status: piece?.status,
						notes: entry.notes
					};
				})
			})
		);
	}
	const known = new Set(concerts.map((c) => c.id));
	for (const event of events.values()) {
		if (event.type !== 'konzert' || known.has(event.id)) continue;
		concerts.push(
			concert({ id: event.id, title: event.displayTitle, date: eventDate(event), location: event.location, event, program: [] })
		);
	}
	concerts.sort((a, b) => b.dateKey.localeCompare(a.dateKey) || collator.compare(a.title, b.title));
	const concertsById = new Map(concerts.map((c) => [c.id, c]));

	// "Gespielt bei", oldest first.
	for (const c of [...concerts].reverse()) {
		for (const item of c.program) {
			const piece = item.pieceId ? piecesById.get(item.pieceId) : undefined;
			if (piece && !piece.playedAt.includes(c.id)) piece.playedAt.push(c.id);
		}
	}

	return {
		catalog: catalog.ok ? { ok: true, catalog: catalog.catalog } : catalog,
		schedule,
		sheet: repertoire.ok ? 'ok' : repertoire.reason,
		pieces,
		piecesById,
		concerts,
		concertsById,
		today
	};
}

function summary({ id, title, composer, catalogue, category, programs, partCount, status, search }: PieceDetail): PieceSummary {
	return { id, title, composer, catalogue, category, programs, partCount, status, search };
}

function eventDate(event: ShownEvent): FuzzyDate {
	return parseFuzzyDate(eventDay(event, config.timeZone))!;
}

function concert(input: Omit<LibraryConcert, 'dateKey' | 'label'>): LibraryConcert {
	return {
		...input,
		dateKey: input.date ? fuzzyDateKey(input.date) : '',
		label: input.date ? formatFuzzyDate(input.date, config.locale) : null
	};
}

/** Whether a concert is over: a calendar event once it ended, a sheet date once its day (month, year) is past. */
export function isPastConcert(concert: LibraryConcert, today: string): boolean {
	if (concert.event) return concert.event.past;
	if (!concert.date) return true;
	return concert.dateKey < today.slice(0, concert.dateKey.length);
}

/** Only what a concert list shows. */
export function concertSummary(concert: LibraryConcert) {
	return {
		id: concert.id,
		title: concert.title,
		label: concert.label,
		dateText: concert.dateText,
		location: concert.location,
		programCount: concert.program.length,
		inCalendar: !!concert.event
	};
}
export type ConcertSummary = ReturnType<typeof concertSummary>;
