/**
 * Small seasonal drawings tucked into a few quiet corners (#202): a snowflake in winter, a
 * blossom in spring, a pumpkin the week before Halloween. Read from the orchestra's calendar
 * day, so everyone sees the same one; the feature "seasons" turns them off.
 */

export const SEASONS = ['advent', 'newYear', 'winter', 'spring', 'summer', 'autumn', 'halloween'] as const;
export type Season = (typeof SEASONS)[number];

/** The season of a day ("2026-12-03"), as the northern half of the world has them. */
export function seasonOf(day: string): Season {
	const monthDay = day.slice(5, 10);
	if (monthDay >= '12-31' || monthDay <= '01-01') return 'newYear';
	if (monthDay >= '12-01' && monthDay <= '12-26') return 'advent';
	if (monthDay >= '10-24' && monthDay <= '10-31') return 'halloween';
	const month = Number(day.slice(5, 7));
	if (month >= 3 && month <= 5) return 'spring';
	if (month >= 6 && month <= 8) return 'summer';
	if (month >= 9 && month <= 11) return 'autumn';
	return 'winter';
}
