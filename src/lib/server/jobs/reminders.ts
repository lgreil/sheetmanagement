import { config } from '#lib/config/index.ts';
import { dateFormat } from '#lib/events/format.ts';
import { t } from '#lib/i18n/index.ts';
import { loanReminders, peopleWithRight, signupReminders, type Reminder, type ReminderKind } from '#lib/reminders/reminders.ts';
import { eventDay } from '#lib/repertoire/dates.ts';
import { authConfig } from '../auth/index.ts';
import { getStore, reminderKey } from '../db/index.ts';
import { features } from '../env.ts';
import { getLibrary } from '../library.ts';
import { notify, pushReady, type Notice } from '../push/index.ts';
import { getAccessList, getLoans, getSignups } from '../repertoire.ts';
import type { JobResult } from './index.ts';

/**
 * Reminders on members' devices (#157, #144): a rehearsal or concert in the next days that
 * someone hasn't answered, and rented music that is due or overdue. Each reminder goes out
 * once (logged in the store); a few per run, the rest on the next one, so a run stays small.
 * Nobody is woken up: nothing is sent at night.
 */

/** Messages per run; the job runs every half hour. */
const PER_RUN = 20;
/** Sent between these hours in the orchestra's time zone. */
const QUIET_UNTIL = 8;
const QUIET_FROM = 21;
/** The log is only needed while a reminder could repeat. */
const KEEP_DAYS = 365;

const hourFormat = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: config.timeZone });
const eventDate = dateFormat(config.locale, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: config.timeZone });
const allDayDate = dateFormat(config.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

export function isQuietTime(now: number): boolean {
	const hour = Number(hourFormat.format(now));
	return hour < QUIET_UNTIL || hour >= QUIET_FROM;
}

type Pending = Reminder<unknown> & { notice: Notice };

export async function sendReminders(now = Date.now()): Promise<JobResult> {
	if (!pushReady()) return { ok: true, summary: t.reminders.pushOff };
	if (isQuietTime(now)) return { ok: true, summary: t.reminders.quiet };
	const store = getStore();
	const devices = await store.allPush();
	const reachable = new Set(devices.map((device) => device.email));
	if (!reachable.size) return { ok: true, summary: t.reminders.noDevices };

	const on = features();
	const today = eventDay({ start: new Date(now).toISOString(), allDay: false }, config.timeZone);
	const [library, signups, loans, access] = await Promise.all([
		on.signups ? getLibrary(now) : null,
		on.signups ? getSignups() : null,
		on.loans ? getLoans() : null,
		getAccessList()
	]);
	if (on.signups && library && !library.schedule.ok) return { ok: false, summary: t.reminders.noCalendar };

	const pending: Pending[] = [];
	if (library?.schedule.ok && signups && access) {
		const orchestraOf = (event: { id: string; concertId?: string }) =>
			library.concertsById.get(event.id)?.orchestra ?? (event.concertId ? library.concertsById.get(event.concertId)?.orchestra : undefined);
		for (const reminder of signupReminders(library.schedule.events, signups.byEvent, access.members, { orchestraOf, today })) {
			const event = reminder.about;
			const when = event.allDay ? allDayDate.format(new Date(event.start)) : eventDate.format(new Date(event.start));
			pending.push({
				...reminder,
				notice: { title: t.reminders.signupTitle(event.displayTitle), body: t.reminders.signupBody(when), url: `/konzerte/${encodeURIComponent(event.id)}`, tag: `signup-${event.id}` }
			});
		}
	}
	if (loans) {
		const auth = authConfig();
		const people = peopleWithRight(access, auth.mode === 'on' ? auth.bootstrapAdmins : [], 'stuecke.bearbeiten');
		for (const reminder of loanReminders(loans.loans, people, today)) {
			const loan = reminder.about;
			const due = loan.dueAt ? allDayDate.format(new Date(`${loan.dueAt}T00:00:00Z`)) : loan.dueText;
			const overdue = reminder.kind === 'loan-overdue';
			pending.push({
				...reminder,
				notice: {
					title: overdue ? t.reminders.loanOverdueTitle(loan.pieceName) : t.reminders.loanDueTitle(loan.pieceName),
					body: t.reminders.loanBody(loan.from, due),
					url: '/leihmaterial',
					tag: `loan-${reminder.subject}`
				}
			});
		}
	}

	// Only people with a device, and only what hasn't gone out yet.
	const candidates = pending.filter((reminder) => reachable.has(reminder.recipient));
	const sent = new Map<ReminderKind, Set<string>>();
	for (const kind of new Set(candidates.map((reminder) => reminder.kind))) {
		const subjects = [...new Set(candidates.filter((reminder) => reminder.kind === kind).map((reminder) => reminder.subject))];
		sent.set(kind, await store.sentReminders(kind, subjects));
	}
	const due = candidates.filter((reminder) => !sent.get(reminder.kind)?.has(reminderKey(reminder.subject, reminder.recipient)));

	let delivered = 0;
	const batch = due.slice(0, PER_RUN);
	for (const reminder of batch) {
		const reached = await notify([reminder.recipient], reminder.notice, devices);
		// Not reached (push service down): it stays due and is tried on the next run.
		if (!reached.size) continue;
		await store.logReminder(reminder.kind, reminder.subject, reminder.recipient);
		delivered++;
	}
	await store.pruneReminders(KEEP_DAYS);
	if (!due.length) return { ok: true, summary: t.reminders.nothing };
	const missed = batch.length - delivered;
	return {
		// Nothing got through at all: the push services or the keys are worth a look.
		ok: delivered > 0 || !missed,
		summary: t.reminders.sent(delivered, due.length - batch.length) + (missed ? ` ${t.reminders.notReached(missed)}` : '')
	};
}
