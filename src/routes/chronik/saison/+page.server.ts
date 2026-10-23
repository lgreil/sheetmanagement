import { config } from '#lib/config/index.ts';
import { formatDay } from '#lib/events/format.ts';
import { eventDay } from '#lib/repertoire/dates.ts';
import { lastTwelveMonths, readPeriod, seasonReport } from '#lib/repertoire/season.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { getChronicle } from '#lib/server/chronicle.ts';
import { isOn } from '#lib/server/env.ts';
import { getAttendance, getFeedback } from '#lib/server/repertoire.ts';
import type { PageServerLoad } from './$types';

/** The season report for the annual meeting (#147), for the board. */
export const load: PageServerLoad = async ({ locals, url }) => {
	requireRight(locals, 'mitglieder.verwalten');
	const [{ library, past }, attendance, feedback] = await Promise.all([
		getChronicle(),
		isOn('attendance') ? getAttendance() : null,
		getFeedback()
	]);
	const period = readPeriod(url.searchParams.get('von'), url.searchParams.get('bis'), library.today);
	const schedule = library.schedule;
	// Rehearsals that took place; the calendar reaches back three years.
	const rehearsals = schedule.ok
		? schedule.events
				.filter((event) => (event.type === 'probe' || event.type === 'generalprobe') && event.past)
				.map((event) => {
					const entries = [...(attendance?.byEvent.get(event.id)?.values() ?? [])];
					return {
						id: event.id,
						day: eventDay(event, config.timeZone),
						attendance: entries.length ? { present: entries.filter((entry) => entry.present).length, of: entries.length } : undefined
					};
				})
		: [];
	const report = seasonReport({
		period,
		concerts: past,
		rehearsals,
		reports: (feedback?.reports ?? []).map((report) => ({ reportedAt: report.reportedAt, done: report.status === 'done' })),
		wishes: isOn('wishes') ? (feedback?.wishes ?? []) : []
	});
	const labels = new Map(past.map((concert) => [concert.id, concert.label]));
	const year = Number(library.today.slice(0, 4));
	const day = (value: string) => formatDay(value, config.locale);
	return {
		period,
		periodLabel: `${day(period.from)} – ${day(period.to)}`,
		today: day(library.today),
		presets: [
			{ key: 'twelve', ...lastTwelveMonths(library.today) },
			{ key: 'season', from: `${year - 1}-09-01`, to: `${year}-08-31` },
			{ key: 'lastYear', from: `${year - 1}-01-01`, to: `${year - 1}-12-31` },
			{ key: 'thisYear', from: `${year}-01-01`, to: `${year}-12-31` }
		] as const,
		seasonLabel: `${year - 1}/${String(year).slice(2)}`,
		lastYear: year - 1,
		thisYear: year,
		calendar: schedule.ok,
		attendanceOn: isOn('attendance'),
		wishesOn: isOn('wishes'),
		report: { ...report, concerts: report.concerts.map((concert) => ({ ...concert, label: labels.get(concert.id) ?? '' })) }
	};
};
