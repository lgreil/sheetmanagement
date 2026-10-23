import { describe, expect, it } from 'vitest';
import { buildAccessList } from '#lib/access/access.ts';
import type { ShownEvent } from '#lib/events/schedule.ts';
import type { Loan } from '#lib/loans/loans.ts';
import type { Signup } from '#lib/signups/signups.ts';
import { loanReminders, loanSubject, peopleWithRight, signupReminders } from './reminders.ts';

const list = buildAccessList({
	members: [
		['E-Mail', 'Name', 'Instrument', 'Gruppen', 'Orchester', 'Status', 'Pausiert bis'],
		['anna@example.org', 'Anna A', 'Geige I', 'Notenwart', 'EO', '', ''],
		['ben@example.org', 'Ben B', 'Cello', '', 'EO', '', ''],
		['carl@example.org', 'Carl C', 'Viola', '', 'A', '', ''],
		['dora@example.org', 'Dora D', 'Oboe', '', '', 'pausiert', ''],
		['emil@example.org', 'Emil E', '', 'Vorstand', '', '', '']
	],
	groups: [['Gruppe', 'Beschreibung'], ['Notenwart', ''], ['Vorstand', '']],
	rights: [
		['Wer', 'Recht'],
		['Notenwart', 'stuecke.bearbeiten'],
		['vorstand', 'mitglieder.verwalten']
	]
});

const event = (id: string, daysUntil: number, more: Partial<ShownEvent> = {}) =>
	({ id, type: 'probe', past: daysUntil < 0, tentative: false, daysUntil, displayTitle: id, rehearsalIds: [], ...more }) as ShownEvent;
const answer = (eventId: string, email: string) => ({ eventId, email, answer: 'yes' }) as Signup;

describe('signupReminders', () => {
	const remind = (events: ShownEvent[], signups: Signup[] = [], orchestra?: string) =>
		signupReminders(events, Map.groupBy(signups, (signup) => signup.eventId), list.members, { orchestraOf: () => orchestra, today: '2026-10-23' }).map(
			(reminder) => `${reminder.subject} ${reminder.recipient}`
		);

	it('reminds the open players of the next few days, not those who answered', () => {
		expect(remind([event('soon', 2)], [answer('soon', 'ben@example.org')])).toEqual(['soon anna@example.org', 'soon carl@example.org']);
	});

	it('only for players of the event’s orchestra', () => {
		expect(remind([event('eo', 1)], [], 'EO')).toEqual(['eo anna@example.org', 'eo ben@example.org']);
	});

	it('not too early, not afterwards, not for unconfirmed or other dates', () => {
		expect(
			remind([event('later', 4), event('gone', -1), event('maybe', 1, { tentative: true }), event('party', 1, { type: 'sonstiges' })])
		).toEqual([]);
		expect(remind([event('today', 0, { type: 'konzert' })])).toHaveLength(3);
	});
});

describe('loanReminders', () => {
	const loan = (pieceName: string, dueAt: string | undefined, returned = false) => ({ pieceName, dueAt, returned }) as Loan;

	it('once when due soon, once more when overdue, for every recipient', () => {
		const reminders = loanReminders(
			[loan('Moldau', '2026-11-01'), loan('Carmen', '2026-10-01'), loan('Später', '2027-01-01'), loan('Zurück', '2026-10-01', true), loan('Ohne Datum', undefined)],
			['anna@example.org', 'emil@example.org'],
			'2026-10-23'
		);
		expect(reminders.map((reminder) => `${reminder.kind} ${reminder.subject} ${reminder.recipient}`)).toEqual([
			'loan-due moldau|2026-11-01 anna@example.org',
			'loan-due moldau|2026-11-01 emil@example.org',
			'loan-overdue carmen|2026-10-01 anna@example.org',
			'loan-overdue carmen|2026-10-01 emil@example.org'
		]);
	});

	it('a new return date is a new reminder', () => {
		expect(loanSubject(loan('Moldau', '2026-11-01'))).not.toBe(loanSubject(loan('Moldau', '2026-12-01')));
	});
});

describe('peopleWithRight', () => {
	it('finds members through their groups, and the bootstrap admins', () => {
		expect(peopleWithRight(list, ['Boss@Example.org'], 'stuecke.bearbeiten')).toEqual(['boss@example.org', 'anna@example.org']);
		expect(peopleWithRight(list, [], 'mitglieder.verwalten')).toEqual(['emil@example.org']);
		expect(peopleWithRight(null, [], 'mitglieder.verwalten')).toEqual([]);
	});
});
