import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAccessList } from '#lib/access/access.ts';
import type { ShownEvent } from '#lib/events/schedule.ts';
import { memoryStore } from '../db/memory.ts';

const store = { current: memoryStore() };
const notify = vi.fn(async (emails: Iterable<string>) => new Set(emails));

vi.mock('../db/index.ts', async (original) => ({ ...(await original<object>()), getStore: () => store.current }));
vi.mock('../push/index.ts', () => ({ pushReady: () => true, notify: (emails: Iterable<string>) => notify(emails) }));
vi.mock('../env.ts', () => ({ features: () => ({ signups: true, loans: true }) }));
vi.mock('../auth/index.ts', () => ({ authConfig: () => ({ mode: 'on', bootstrapAdmins: [] }) }));

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

	it('sends nothing at night', async () => {
		expect(isQuietTime(Date.UTC(2026, 9, 23, 21))).toBe(true);
		expect(isQuietTime(Date.UTC(2026, 9, 23, 5))).toBe(true);
		await sendReminders(Date.UTC(2026, 9, 23, 22));
		expect(notify).not.toHaveBeenCalled();
	});
});
