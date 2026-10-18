import { getLibrary } from '#lib/server/library.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const library = await getLibrary();
	const result = library.schedule;
	if (!result.ok) return { calendar: result.reason, nextConcert: null, nextRehearsal: null, program: [] };

	const upcoming = result.events.filter((event) => !event.past);
	const nextConcert = upcoming.find((event) => event.type === 'konzert') ?? null;
	const nextRehearsal = upcoming.find((event) => event.type === 'probe' || event.type === 'generalprobe') ?? null;
	const program = nextConcert ? (library.concertsById.get(nextConcert.id)?.program ?? []).map((item) => item.title) : [];
	return { calendar: 'ok' as const, nextConcert, nextRehearsal, program };
};
