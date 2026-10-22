import { getLibrary, namedItem } from '#lib/server/library.ts';
import { getRehearsalPlan } from '#lib/server/repertoire.ts';
import { openWork } from '#lib/server/todo.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const library = await getLibrary();
	const [open, plan] = await Promise.all([openWork(locals), getRehearsalPlan()]);
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
