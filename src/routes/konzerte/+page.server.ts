import { getSchedule } from '#lib/server/schedule.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const result = await getSchedule();
	if (!result.ok) return { error: result.reason, upcoming: [], past: [], concertTitles: {}, subscribeUrl: null };

	const concertTitles: Record<string, string> = {};
	for (const event of result.events) {
		if (event.type === 'konzert') concertTitles[event.id] = event.displayTitle;
	}

	return {
		error: null,
		upcoming: result.events.filter((event) => !event.past),
		past: result.events.filter((event) => event.past && event.type === 'konzert').reverse(),
		concertTitles,
		subscribeUrl: result.subscribeUrl
	};
};
