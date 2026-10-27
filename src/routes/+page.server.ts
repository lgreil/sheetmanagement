import { getLibrary, namedItem, shownDates } from '#lib/server/library.ts';
import { getRehearsalNotes, getRehearsalPlan } from '#lib/server/repertoire.ts';
import { currentRehearsalNote } from '#lib/notes/rehearsal-notes.ts';
import { myAnswers } from '#lib/server/signups.ts';
import { openWork } from '#lib/server/todo.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const library = await getLibrary();
	const [open, plan, notes, answers] = await Promise.all([openWork(locals), getRehearsalPlan(), getRehearsalNotes(), myAnswers(locals)]);
	const result = library.schedule;
	if (!result.ok)
		return { calendar: result.reason, nextConcert: null, nextRehearsal: null, rehearsalFor: undefined, rehearsalParts: undefined, rehearsing: [], program: [], lastNote: null, todo: open, answers: null };

	// A member's next rehearsal is one of their own orchestras.
	const shown = await shownDates(library, locals);
	const upcoming = result.events.filter((event) => !event.past && shown(event));
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
	// What the last rehearsal left to practise (#145), until the next one is over too.
	const last = currentRehearsalNote(
		result.events.filter((event) => (event.type === 'probe' || event.type === 'generalprobe') && shown(event)),
		notes.byEvent
	);
	const lastNote =
		last && (last.note.practise || last.note.next)
			? { url: `/kalender/${encodeURIComponent(last.event.id)}`, date: last.event.date.long, practise: last.note.practise, next: last.note.next }
			: null;
	return {
		calendar: 'ok' as const,
		lastNote,
		nextConcert,
		nextRehearsal,
		rehearsalFor: rehearsalConcert?.title,
		rehearsalParts,
		rehearsing,
		program,
		todo: open,
		// "Bist du dabei?" right on the cards: the member's answers, null without sign-ups.
		answers
	};
};
