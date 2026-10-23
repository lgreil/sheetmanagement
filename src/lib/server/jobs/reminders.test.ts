import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAccessList } from '#lib/access/access.ts';
import type { ShownEvent } from '#lib/events/schedule.ts';
import { memoryStore } from '../db/memory.ts';

const store = { current: memoryStore() };
const notify = vi.fn(async (emails: Iterable<string>) => new Set(emails));

vi.mock('../db/index.ts', async (original) => ({ ...(await original<object>()), getStore: () => store.current }));
vi.mock('../push/index.ts', () => ({ pushReady: () => true, notify: (emails: Iterable<string>) => notify(emails) }));
vi.mock('../env.ts', () => ({ features: () => ({ signups: true, loans: true }), orchestra: () => ({ name: 'Musterorchester' }) }));
vi.mock('../auth/index.ts', () => ({ authConfig: () => ({ mode: 'on', bootstrapAdmins: [], sessionSecret: 'x'.repeat(32) }) }));
// Email (#123): off unless a test connects an account.
const mail = { account: null as null | { email: string; origin: string; connectedAt: string } };
const sendMail = vi.fn(async (_to: string, _subject: string, _text: string) => true);
vi.mock('../mail/index.ts', () => ({ mailAccount: async () => mail.account, sendMail: (to: string, subject: string, text: string) => sendMail(to, subject, text) }));

const access = buildAccessList({
	members: [
		['E-Mail', 'Name', 'Instrument', 'Gruppen'],
		['anna@example.org', 'Anna', 'Geige', 'Notenwart'],
		['ben@example.org', 'Ben', 'Cello', '']
	],
	groups: [['Gruppe', 'Beschreibung'], ['Notenwart', '']],
	rights: [['Wer', 'Recht'], ['Notenwart', 'stuecke.bearbeiten']]
});
const probe = { id: 'probe-1', type: 'probe', past: false, tentative: false, daysUntil: 1, displayTitle: 'Probe', start: '2026-10-24T17:00:00Z', allDay: false, rehearsalIds: [] } as unknown as ShownEvent;

vi.mock('../library.ts', () => ({ getLibrary: async () => ({ schedule: { ok: true, events: [probe] }, concertsById: new Map() }) }));
vi.mock('../repertoire.ts', () => ({
	getAccessList: async () => access,
	getSignups: async () => ({ byEvent: new Map() }),
	getLoans: async () => ({ loans: [{ pieceName: 'Moldau', from: 'Verlag', dueAt: '2026-10-30', dueText: '', returned: false }] })
}));

const { isQuietTime, sendReminders } = await import('./reminders.ts');

// 23 October 2026, 10:00 in Berlin.
const MORNING = Date.UTC(2026, 9, 23, 8);

describe('sendReminders', () => {
	beforeEach(async () => {
		store.current = memoryStore();
		notify.mockClear();
		sendMail.mockClear();
		mail.account = null;
		for (const email of ['anna@example.org', 'ben@example.org']) {
			await store.current.savePush({ endpoint: `https://push/${email}`, email, p256dh: 'k', auth: 'a' });
		}
	});

	it('sends each reminder once', async () => {
		expect((await sendReminders(MORNING)).summary).toMatch(/^3 /);
		// The open rehearsal for both, the loan for the one who looks after the music.
		expect(notify.mock.calls.map(([emails]) => [...emails][0]).sort()).toEqual(['anna@example.org', 'anna@example.org', 'ben@example.org']);
		notify.mockClear();
		await sendReminders(MORNING + 30 * 60_000);
		expect(notify).not.toHaveBeenCalled();
	});

	it('tries again next time when a device couldn’t be reached', async () => {
		notify.mockImplementationOnce(async () => new Set());
		await sendReminders(MORNING);
		notify.mockClear();
		await sendReminders(MORNING + 30 * 60_000);
		expect(notify).toHaveBeenCalledTimes(1);
	});

	it('only reminds people with a device', async () => {
		await store.current.deletePush('https://push/ben@example.org');
		await sendReminders(MORNING);
		expect(notify.mock.calls.every(([emails]) => [...emails][0] === 'anna@example.org')).toBe(true);
	});

	it('emails those without a device, unless they turned it off (#123)', async () => {
		mail.account = { email: 'orchester@example.org', origin: 'https://noten.example.org', connectedAt: '' };
		await store.current.deletePush('https://push/ben@example.org');
		await store.current.deletePush('https://push/anna@example.org');
		await store.current.setMailOptOut('anna@example.org', true);
		const run = await sendReminders(MORNING);
		expect(notify).not.toHaveBeenCalled();
		expect(sendMail.mock.calls.map(([to]) => to)).toEqual(['ben@example.org']);
		const [, subject, text] = sendMail.mock.calls[0];
		expect(subject).toBe('Probe: Kommst du?');
		expect(text).toContain('Hallo Ben,');
		// One-click answers and the way out.
		expect(text).toMatch(/Ich komme: https:\/\/noten\.example\.org\/antwort\/[\w.-]+\?a=yes/);
		expect(text).toContain('https://noten.example.org/profil#email');
		expect(run.summary).toContain('E-Mail');
	});

	it('emails when a device couldn’t be reached', async () => {
		mail.account = { email: 'orchester@example.org', origin: 'https://noten.example.org', connectedAt: '' };
		notify.mockImplementation(async () => new Set());
		await sendReminders(MORNING);
		notify.mockImplementation(async (emails: Iterable<string>) => new Set(emails));
		expect(sendMail).toHaveBeenCalledTimes(3);
		sendMail.mockClear();
		await sendReminders(MORNING + 30 * 60_000);
		expect(sendMail).not.toHaveBeenCalled();
	});

	it('sends nothing at night', async () => {
		expect(isQuietTime(Date.UTC(2026, 9, 23, 21))).toBe(true);
		expect(isQuietTime(Date.UTC(2026, 9, 23, 5))).toBe(true);
		await sendReminders(Date.UTC(2026, 9, 23, 22));
		expect(notify).not.toHaveBeenCalled();
	});
});
