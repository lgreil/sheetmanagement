import { isPseudonym, pseudonym } from './erase.ts';

/**
 * Retention (#158): if the orchestra sets it on /einstellungen, sign-ups and attendance older
 * than a number of seasons lose the person's name. The rows stay, each under a pseudonym of
 * its own, so the Chronik and the season report count them as before.
 */

/** A season runs from September to August, as the season report has it. */
const SEASON_START = '-09-01';

/**
 * The first day whose entries keep their names: the start of the season `seasons - 1`
 * seasons before the current one. One season keeps only the current one.
 */
export function retentionCutoff(today: string, seasons: number): string {
	const year = Number(today.slice(0, 4));
	const current = today.slice(4) >= SEASON_START ? year : year - 1;
	return `${current - (seasons - 1)}${SEASON_START}`;
}

/** The day of an entry: from the calendar, else when it was answered, else the year in its label (taken as its last day). */
export function entryDay(eventDay: string | undefined, answeredAt: string | undefined, label: string | undefined): string | undefined {
	if (eventDay) return eventDay;
	const answered = /^\d{4}-\d{2}-\d{2}/.exec(answeredAt ?? '')?.[0];
	if (answered) return answered;
	const year = /\b(19|20)\d{2}\b/.exec(label ?? '')?.[0];
	return year ? `${year}-12-31` : undefined;
}

/**
 * The rows to rewrite: older than the cutoff, with a person who isn't a pseudonym yet. Rows
 * whose day can't be told stay as they are. At most `limit`, so one run stays small.
 */
export function planRetention<V extends { who?: string }>(
	rows: { row: number; values: V }[],
	dayOf: (values: V) => string | undefined,
	cutoff: string,
	{ anonymous, newId, limit = 500, clear = [] }: { anonymous: string; newId: () => string; limit?: number; clear?: string[] }
): { row: number; values: Record<string, string> }[] {
	return rows
		.filter(({ values }) => values.who?.trim() && !isPseudonym(values.who))
		.filter(({ values }) => {
			const day = dayOf(values);
			return !!day && day < cutoff;
		})
		.slice(0, limit)
		.map(({ row }) => ({ row, values: { who: pseudonym(newId()), name: anonymous, ...Object.fromEntries(clear.map((column) => [column, ''])) } }));
}
