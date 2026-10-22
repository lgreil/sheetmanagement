import { config } from '#lib/config/index.ts';
import { urgentLoans } from '#lib/loans/loans.ts';
import { eventDay } from '#lib/repertoire/dates.ts';
import { getAccessList, getAttendance, getFeedback, getLoans } from './repertoire.ts';
import { features } from './env.ts';
import { getSchedule } from './schedule.ts';

/** Rehearsals this many days back still ask for their attendance to be taken. */
const ATTENDANCE_DAYS = 14;

export interface OpenWork {
	reports: number;
	wishes: number;
	requests: number;
	/** Rented music due within two weeks or overdue (#119). */
	loans: number;
	attendance: number;
	/** The oldest rehearsal without attendance. */
	attendanceUrl?: string;
}

/**
 * What's waiting for the people who look after things, only counted for those who may act on
 * it: "Wartet auf dich" on the start page and the counts on the workspace tabs (#139). All of
 * it comes from the cached sheet and calendar, so it costs no extra Google request.
 */
export async function openWork(locals: App.Locals): Promise<OpenWork | null> {
	const rights = locals.access.rights;
	const on = features();
	const reports = rights.has('stuecke.bearbeiten');
	const admin = rights.has('mitglieder.verwalten') && locals.auth === 'on';
	const attendance = on.attendance && rights.has('anwesenheit.erfassen') && locals.auth === 'on';
	if (!reports && !admin && !attendance) return null;
	const [feedback, access, loans, taken, schedule] = await Promise.all([
		getFeedback(),
		admin ? getAccessList() : null,
		reports && on.loans ? getLoans() : null,
		attendance ? getAttendance() : null,
		attendance ? getSchedule() : null
	]).catch(() => [null, null, null, null, null] as const);
	const today = eventDay({ start: new Date().toISOString(), allDay: false }, config.timeZone);
	// Recent rehearsals nobody has taken attendance for yet (#120); the oldest is the link.
	const untaken =
		taken && schedule?.ok
			? schedule.events.filter(
					(event) =>
						(event.type === 'probe' || event.type === 'generalprobe') &&
						event.past &&
						event.daysUntil >= -ATTENDANCE_DAYS &&
						!taken.byEvent.get(event.id)?.size
				)
			: [];
	return {
		reports: reports ? (feedback?.reports.filter((report) => report.status === 'open').length ?? 0) : 0,
		wishes: admin && on.wishes ? (feedback?.wishes.filter((wish) => wish.status === 'open').length ?? 0) : 0,
		requests: admin ? (access?.requests.length ?? 0) : 0,
		loans: loans ? urgentLoans(loans.loans, today).length : 0,
		attendance: untaken.length,
		attendanceUrl: untaken[0] ? `/konzerte/${encodeURIComponent(untaken[0].id)}/anwesenheit` : undefined
	};
}

/** The counts by page, for tabs and menus: only pages with something open. */
export function countsByPage(work: OpenWork | null): Record<string, number> {
	if (!work) return {};
	const counts: Record<string, number> = { '/meldungen': work.reports, '/wuensche': work.wishes, '/admin': work.requests, '/leihmaterial': work.loans };
	return Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 0));
}
