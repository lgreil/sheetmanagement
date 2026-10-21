import { urgentLoans } from '#lib/loans/loans.ts';
import { getLibrary, namedItem, type Library } from '#lib/server/library.ts';
import { getAccessList, getAttendance, getFeedback, getLoans, getRehearsalPlan } from '#lib/server/repertoire.ts';
import type { PageServerLoad } from './$types';

/** Rehearsals this many days back still ask for their attendance to be taken. */
const ATTENDANCE_DAYS = 14;

/** What's waiting for the people who look after things; only counted for those who may act on it. */
async function todo(locals: App.Locals, library: Library) {
	const rights = locals.access.rights;
	const reports = rights.has('stuecke.bearbeiten');
	const admin = rights.has('mitglieder.verwalten') && locals.auth === 'on';
	const attendance = rights.has('anwesenheit.erfassen') && locals.auth === 'on';
	if (!reports && !admin && !attendance) return null;
	const [feedback, access, loans, taken] = await Promise.all([
		getFeedback(),
		admin ? getAccessList() : null,
		reports ? getLoans() : null,
		attendance ? getAttendance() : null
	]).catch(() => [null, null, null, null] as const);
	// Recent rehearsals nobody has taken attendance for yet (#120); the oldest is the link.
	const untaken =
		attendance && taken && library.schedule.ok
			? library.schedule.events.filter(
					(event) =>
						(event.type === 'probe' || event.type === 'generalprobe') &&
						event.past &&
						event.daysUntil >= -ATTENDANCE_DAYS &&
						!taken.byEvent.get(event.id)?.size
				)
			: [];
	return {
		reports: reports ? (feedback?.reports.filter((report) => report.status === 'open').length ?? 0) : 0,
		wishes: admin ? (feedback?.wishes.filter((wish) => wish.status === 'open').length ?? 0) : 0,
		requests: admin ? (access?.requests.length ?? 0) : 0,
		// Rented music due within two weeks or overdue (#119).
		loans: loans ? urgentLoans(loans.loans, library.today).length : 0,
		attendance: untaken.length,
		attendanceUrl: untaken[0] ? `/konzerte/${encodeURIComponent(untaken[0].id)}/anwesenheit` : undefined
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	const library = await getLibrary();
	const [open, plan] = await Promise.all([todo(locals, library), getRehearsalPlan()]);
	const result = library.schedule;
	if (!result.ok)
		return { calendar: result.reason, nextConcert: null, nextRehearsal: null, rehearsalFor: undefined, rehearsalParts: undefined, rehearsing: [], program: [], todo: open };

	const upcoming = result.events.filter((event) => !event.past);
	const nextConcert = upcoming.find((event) => event.type === 'konzert') ?? null;
	const nextRehearsal = upcoming.find((event) => event.type === 'probe' || event.type === 'generalprobe') ?? null;
	const program = nextConcert
		? (library.concertsById.get(nextConcert.id)?.program ?? []).map(({ title, pieceId }) => ({ title, pieceId }))
		: [];
	// What's on at the next rehearsal, from the rehearsal plan, linked to the pieces.
	const rehearsing = nextRehearsal
		? (plan?.byEvent.get(nextRehearsal.id) ?? []).map((entry) => {
				const { title, pieceId } = namedItem(library, entry.pieceName);
				return { title, pieceId };
			})
		: [];
	// "Meine Noten" for the rehearsal: the planned pieces, else the programme it prepares for.
	const rehearsalConcert = nextRehearsal?.concertId ? library.concertsById.get(nextRehearsal.concertId) : undefined;
	const rehearsalParts =
		nextRehearsal && (rehearsing.length || rehearsalConcert?.program.length) ? `/meine-noten?probe=${encodeURIComponent(nextRehearsal.id)}` : undefined;
	return {
		calendar: 'ok' as const,
		nextConcert,
		nextRehearsal,
		rehearsalFor: rehearsalConcert?.title,
		rehearsalParts,
		rehearsing,
		program,
		todo: open
	};
};
