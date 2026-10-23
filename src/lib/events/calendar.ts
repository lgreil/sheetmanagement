/**
 * The month grid for the calendar view on /kalender (#100): whole weeks from Monday to
 * Sunday, with the days of the neighbouring months to fill them. Days are "2026-11-15",
 * calendar days without a time zone.
 */

export interface GridDay {
	/** "2026-11-15" */
	key: string;
	day: number;
	/** In the month shown, not a neighbouring one. */
	inMonth: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** "2026-11" → its weeks, Monday first. */
export function monthGrid(monthKey: string): GridDay[][] {
	const [year, month] = monthKey.split('-').map(Number);
	const first = new Date(Date.UTC(year, month - 1, 1));
	// getUTCDay: Sunday 0 … Saturday 6; Monday-first offset.
	const start = new Date(first);
	start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
	const weeks: GridDay[][] = [];
	const cursor = new Date(start);
	do {
		const week: GridDay[] = [];
		for (let i = 0; i < 7; i++) {
			week.push({ key: dayKey(cursor), day: cursor.getUTCDate(), inMonth: cursor.getUTCMonth() === month - 1 });
			cursor.setUTCDate(cursor.getUTCDate() + 1);
		}
		weeks.push(week);
	} while (cursor.getUTCMonth() === month - 1);
	return weeks;
}

/** "2026-11" → "2026-12"; a negative step goes back. */
export function addMonths(monthKey: string, step: number): string {
	const [year, month] = monthKey.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1 + step, 1));
	return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

/** An event's day key from its date parts ("2026-11" + "15"). */
export const eventDayKey = (date: { monthKey: string; day: string }) => `${date.monthKey}-${pad(Number(date.day))}`;
