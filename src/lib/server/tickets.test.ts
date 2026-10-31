import { beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStore } from './db/memory.ts';
import type { Store } from './db/types.ts';

let store: Store;
const sent: { to: string; subject: string; text: string }[] = [];

vi.mock('./db/index.ts', () => ({ getStore: () => store }));
vi.mock('./env.ts', () => ({ orchestra: () => ({ name: 'Musterorchester' }) }));
vi.mock('./mail/index.ts', () => ({
	mailAccount: async () => ({ email: 'orchester@example.org', origin: 'https://noten.example.org', connectedAt: '' }),
	sendMail: async (to: string, subject: string, text: string) => (sent.push({ to, subject, text }), true)
}));
const concert = {
	id: 'herbst',
	type: 'konzert',
	displayTitle: 'Herbstkonzert',
	start: '2026-11-21T16:00:00.000Z',
	end: '2026-11-21T18:00:00.000Z',
	past: false,
	location: 'Aula',
	date: { long: 'Samstag, 21. November 2026', time: '17:00 – 19:00' }
};
vi.mock('./library.ts', () => ({ getLibrary: async () => ({ schedule: { ok: true, byId: new Map([['herbst', concert]]) } }) }));

const { publicSale, reserve, pruneTickets } = await import('./tickets.ts');

const now = Date.parse('2026-11-01T12:00:00Z');
const sale = {
	concertId: 'herbst',
	seating: 'free' as const,
	capacity: 3,
	prices: [
		{ type: 'erwachsene', label: 'Erwachsene', cents: 1200 },
		{ type: 'kinder', label: 'Kinder', cents: 0 }
	],
	onlineFee: { percent: 3.5, cents: 25 },
	onlineUntil: '2026-11-21T14:00:00.000Z',
	open: true
};

beforeEach(async () => {
	store = memoryStore();
	sent.length = 0;
	await store.saveTicketSale(sale);
});

describe('publicSale', () => {
	it('shows the price, the online surcharge and the sum apart', async () => {
		const shown = await publicSale('herbst', now);
		expect(shown).toMatchObject({ state: 'open', left: 3, onlineFee: { percent: 3.5, cents: 25 } });
		expect(shown?.prices).toEqual([
			{ type: 'erwachsene', label: 'Erwachsene', cents: 1200, feeCents: 67, onlineCents: 1267 },
			{ type: 'kinder', label: 'Kinder', cents: 0, feeCents: 0, onlineCents: 0 }
		]);
		// Nothing about buyers.
		expect(JSON.stringify(shown)).not.toContain('@');
	});

	it('is gone for a sale that isn’t open, and for other events', async () => {
		await store.saveTicketSale({ ...sale, open: false });
		expect(await publicSale('herbst', now)).toBeNull();
		expect(await publicSale('probe', now)).toBeNull();
	});
});

describe('reserve', () => {
	it('places the order, charges the surcharge online and says so in the mail', async () => {
		const result = await reserve('herbst', { name: 'Anna Bach', email: 'Anna@Example.org', tickets: { erwachsene: 2, kinder: 1 } }, '1.2.3.4', now);
		expect(result).toMatchObject({ ok: true, mailed: true });
		if (!result.ok) return;
		expect(result.url).toBe(`https://noten.example.org/karte/${result.orderId}`);
		const order = await store.ticketOrder(result.orderId);
		expect(order?.tickets.map((ticket) => [ticket.cents, ticket.feeCents])).toEqual([
			[1267, 67],
			[1267, 67],
			[0, 0]
		]);
		const [mail] = sent;
		// Intl puts a no-break space before the euro sign.
		mail.text = mail.text.replace(/ /g, ' ');
		expect(mail.to).toBe('anna@example.org');
		expect(mail.text).toContain('2 × Erwachsene à 12,67 € (12,00 € + 0,67 € Online-Zuschlag) = 25,34 €');
		expect(mail.text).toContain('1 × Kinder à 0,00 € = 0,00 €');
		expect(mail.text).toContain('Darin sind 1,34 € Online-Zuschlag');
		expect(mail.text).toContain(result.url!);
		for (const ticket of order!.tickets) expect(mail.text).toContain(ticket.code);
	});

	it('refuses what doesn’t fit, what’s wrong, and a closed sale', async () => {
		expect(await reserve('herbst', { name: 'Anna', email: 'a@x.org', tickets: { erwachsene: 4 } }, 'ip', now)).toMatchObject({ ok: false, problem: 'full' });
		expect(await reserve('herbst', { name: 'Anna', email: 'nope', tickets: { erwachsene: 1 } }, 'ip', now)).toMatchObject({ ok: false, problem: 'email' });
		expect(await reserve('herbst', { name: 'Anna', email: 'a@x.org', tickets: {} }, 'ip', now)).toMatchObject({ ok: false, problem: 'empty' });
		expect(await reserve('herbst', { name: 'Anna', email: 'a@x.org', tickets: { erwachsene: 1 } }, 'ip', Date.parse(sale.onlineUntil))).toMatchObject({ ok: false, problem: 'ended' });
		expect(await reserve('probe', { name: 'Anna', email: 'a@x.org', tickets: { erwachsene: 1 } }, 'ip', now)).toMatchObject({ ok: false, status: 404 });
		expect(sent).toEqual([]);
	});

	it('limits orders per caller', async () => {
		await store.saveTicketSale({ ...sale, capacity: 100 });
		for (let i = 0; i < 5; i++) expect((await reserve('herbst', { name: 'Anna', email: `a${i}@x.org`, tickets: { kinder: 1 } }, 'same', now)).ok).toBe(true);
		expect(await reserve('herbst', { name: 'Anna', email: 'a9@x.org', tickets: { kinder: 1 } }, 'same', now)).toMatchObject({ ok: false, problem: 'rate' });
	});
});

describe('pruneTickets', () => {
	it('deletes a guest list some weeks after the concert', async () => {
		await reserve('herbst', { name: 'Anna', email: 'a@x.org', tickets: { kinder: 1 } }, 'ip', now);
		expect(await pruneTickets(Date.parse('2026-12-01T00:00:00Z'))).toBe(0);
		expect(await pruneTickets(Date.parse('2026-12-22T00:00:00Z'))).toBe(1);
		expect(await store.ticketOrders('herbst')).toEqual({ orders: [], tickets: [] });
	});
});
