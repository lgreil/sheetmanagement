import { parseDay } from '#lib/access/access.ts';
import { firstPerformances, pieceKey, playedPieces, type ChronicleConcert } from './chronicle.ts';

/**
 * The season report for the annual meeting (#147): what happened in a period, from data the
 * app already has. Attendance only as totals, never by name.
 */

export interface Period {
	/** "2025-09-01", inclusive. */
	from: string;
	/** "2026-08-31", inclusive. */
	to: string;
}

/**
 * Whether a date key ("2026", "2026-05" or "2026-05-17") lies in the period. One known only
 * by year or month counts when the period covers part of it.
 */
export function inPeriod(dateKey: string, { from, to }: Period): boolean {
	if (!dateKey) return false;
	const start = dateKey.length === 4 ? `${dateKey}-01-01` : dateKey.length === 7 ? `${dateKey}-01` : dateKey;
	// As text "2026-02-31" still sorts after every real day of February.
	const end = dateKey.length === 4 ? `${dateKey}-12-31` : dateKey.length === 7 ? `${dateKey}-31` : dateKey;
	return start <= to && end >= from;
}

/** "2026-10-22" → the twelve months up to and including today: "2025-10-23" to "2026-10-22". */
export function lastTwelveMonths(today: string): Period {
	const date = new Date(`${today}T12:00:00Z`);
	date.setUTCFullYear(date.getUTCFullYear() - 1);
	date.setUTCDate(date.getUTCDate() + 1);
	return { from: date.toISOString().slice(0, 10), to: today };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The period from the address, else the last twelve months; turned round if given backwards. */
export function readPeriod(from: string | null, to: string | null, today: string): Period {
	const fallback = lastTwelveMonths(today);
	const valid = (day: string | null) => !!day && DAY.test(day) && parseDay(day) === day;
	const start = valid(from) ? from! : fallback.from;
	const end = valid(to) ? to! : fallback.to;
	return start <= end ? { from: start, to: end } : { from: end, to: start };
}

export interface SeasonRehearsal {
	id: string;
	/** "2026-05-17" */
	day: string;
	/** Attendance as ticked: who came, of how many rows; undefined when none was taken. */
	attendance?: { present: number; of: number };
}

export interface SeasonInput {
	period: Period;
	/** Every past concert, also older ones: a piece is only new if it wasn't played before. */
	concerts: ChronicleConcert[];
	rehearsals: SeasonRehearsal[];
	/** The days problem reports were made and whether they are done. */
	reports: { reportedAt: string; done: boolean }[];
	/** The days wishes were made. */
	wishes: { submittedAt: string }[];
}

export interface SeasonReport {
	concerts: (ChronicleConcert & { debuts: number[] })[];
	/** Different pieces played in the period. */
	pieces: number;
	/** Pieces played for the first time, in concert order. */
	debuts: { title: string; pieceId?: string; concert: string }[];
	rehearsals: number;
	/** Over the rehearsals with attendance taken; null without any. */
	attendance: { rehearsals: number; average: number; rate: number } | null;
	reports: { made: number; done: number };
	wishes: number;
}

const dayOf = (text: string) => text.trim().slice(0, 10);

export function seasonReport({ period, concerts, rehearsals, reports, wishes }: SeasonInput): SeasonReport {
	const first = firstPerformances(concerts);
	const shown = concerts
		.filter((concert) => inPeriod(concert.dateKey, period))
		.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.title.localeCompare(b.title))
		.map((concert) => ({
			...concert,
			debuts: concert.program.flatMap((item, i) => (first.get(pieceKey(item)) === concert.id ? [i] : []))
		}));
	const debuts = shown.flatMap((concert) =>
		concert.debuts.map((i) => ({ title: concert.program[i].title, pieceId: concert.program[i].pieceId, concert: concert.title }))
	);

	const held = rehearsals.filter((rehearsal) => rehearsal.day >= period.from && rehearsal.day <= period.to);
	const taken = held.flatMap((rehearsal) => (rehearsal.attendance?.of ? [rehearsal.attendance] : []));
	const present = taken.reduce((sum, entry) => sum + entry.present, 0);
	const rows = taken.reduce((sum, entry) => sum + entry.of, 0);
	const inRange = (text: string) => {
		const day = dayOf(text);
		return DAY.test(day) && day >= period.from && day <= period.to;
	};
	const made = reports.filter((report) => inRange(report.reportedAt));

	return {
		concerts: shown,
		pieces: playedPieces(shown).size,
		debuts,
		rehearsals: held.length,
		attendance: taken.length
			? { rehearsals: taken.length, average: Math.round((present / taken.length) * 10) / 10, rate: Math.round((present / rows) * 100) }
			: null,
		reports: { made: made.length, done: made.filter((report) => report.done).length },
		wishes: wishes.filter((wish) => inRange(wish.submittedAt)).length
	};
}
