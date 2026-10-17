import { getSchedule } from '#lib/server/schedule.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const result = await getSchedule();
	if (!result.ok) return { calendar: result.reason, nextConcert: null, nextRehearsal: null };

	const upcoming = result.events.filter((event) => !event.past);
	const nextConcert = upcoming.find((event) => event.type === 'konzert') ?? null;
	const nextRehearsal = upcoming.find((event) => event.type === 'probe' || event.type === 'generalprobe') ?? null;
	return { calendar: 'ok' as const, nextConcert, nextRehearsal };
};
