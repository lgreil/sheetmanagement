import { addDays, DAY_CAP_SECONDS } from '#lib/practice/practice.ts';
import type { Store } from '../db/types.ts';
import { DEMO_DESK_PARTNER, DEMO_MEMBER } from './data.ts';

/**
 * The demo member's practice time: turned on, with about seven weeks of practice before
 * today (some 30 hours, a small tree on its way to the first big one), so the overview and the
 * tree have something to show. The demo admin has it off, to show the question. Her desk partner
 * offers her the bowings in the Egmont part, to take over or not.
 */
export async function seedDemoPractice(store: Store, today: string): Promise<void> {
	await store.setPracticeOn(DEMO_MEMBER.email, true);
	await store.shareMarks(DEMO_DESK_PARTNER.email, 'demo-egmont-9', {
		1: [
			{ color: 'graphite', points: [0.3, 0.33], symbol: 'downbow' },
			{ color: 'graphite', points: [0.42, 0.33], symbol: 'upbow' },
			{ color: 'graphite', points: [0.55, 0.335], symbol: 'mf' },
			{ color: 'red', points: [0.2, 0.47, 0.3, 0.462, 0.4, 0.458, 0.5, 0.462, 0.6, 0.47] }
		]
	});
	// Minutes per weekday, Monday first: more before the weekend rehearsal, a rest day now and then.
	const week = [35, 0, 50, 25, 70, 40, 0];
	for (let back = 48; back >= 1; back--) {
		const day = addDays(today, -back);
		const weekday = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
		const minutes = week[weekday] + ((back * 7) % 23) - 6;
		if (minutes > 5) await store.addPractice(DEMO_MEMBER.email, day, minutes * 60, DAY_CAP_SECONDS);
	}
}
