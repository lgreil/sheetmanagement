import { getLibrary, namedItem } from '#lib/server/library.ts';
import { getAccessList, getFeedback, getRehearsalPlan } from '#lib/server/repertoire.ts';
import type { PageServerLoad } from './$types';

/** What's waiting for the people who look after things; only counted for those who may act on it. */
async function todo(locals: App.Locals) {
	const rights = locals.access.rights;
	const reports = rights.has('stuecke.bearbeiten');
	const admin = rights.has('mitglieder.verwalten') && locals.auth === 'on';
	if (!reports && !admin) return null;
	const [feedback, access] = await Promise.all([getFeedback(), admin ? getAccessList() : null]).catch(() => [null, null] as const);
	return {
		reports: reports ? (feedback?.reports.filter((report) => report.status === 'open').length ?? 0) : 0,
		wishes: admin ? (feedback?.wishes.filter((wish) => wish.status === 'open').length ?? 0) : 0,
		requests: admin ? (access?.requests.length ?? 0) : 0
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	const [library, open, plan] = await Promise.all([getLibrary(), todo(locals), getRehearsalPlan()]);
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
