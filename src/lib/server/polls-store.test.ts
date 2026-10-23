import { describe, expect, it } from 'vitest';
import type { NewPoll } from '#lib/polls/polls.ts';
import { MemoryPollStore, SqlPollStore, type PollStore, type SqlDatabase, type SqlStatement } from './polls-store.ts';

// Node's own SQLite; the project has no Node types, so the little that's used is typed here.
interface Sqlite {
	prepare(sql: string): {
		all(...values: unknown[]): unknown[];
		get(...values: unknown[]): unknown;
		run(...values: unknown[]): unknown;
	};
}
const { DatabaseSync } = (await import(/* @vite-ignore */ `node:${'sqlite'}`)) as { DatabaseSync: new (path: string) => Sqlite };

/** node:sqlite dressed up as D1, so the SQL that runs on Cloudflare runs here too. */
function sqlite(): SqlDatabase {
	const db = new DatabaseSync(':memory:');
	const statement = (sql: string, values: (string | number | null)[] = []): SqlStatement => ({
		bind: (...more) => statement(sql, [...values, ...more]),
		all: async <T>() => ({ results: db.prepare(sql).all(...values) as T[] }),
		first: async <T>() => (db.prepare(sql).get(...values) as T | undefined) ?? null,
		run: async () => db.prepare(sql).run(...values)
	});
	return { prepare: (sql) => statement(sql) };
}

const poll: NewPoll = {
	title: 'Probenwochenende Frühjahr',
	options: [
		{ id: 'o1', date: '2027-03-06' },
		{ id: 'o2', date: '2027-03-13', start: '10:00', end: '17:00' }
	],
	groups: ['Orga', 'Dirigat']
};
const vera = { email: 'vera@example.org', name: 'Vera' };

for (const [name, make] of [
	['SqlPollStore (SQLite)', () => new SqlPollStore(sqlite())],
	['MemoryPollStore', () => new MemoryPollStore()]
] as [string, () => PollStore][]) {
	describe(name, () => {
		it('keeps a poll with its options and groups', async () => {
			const store = make();
			const created = await store.create(poll, vera);
			expect(await store.list()).toEqual([created]);
			const got = await store.get(created.id);
			expect(got?.poll).toMatchObject({ title: poll.title, options: poll.options, groups: poll.groups, createdBy: vera.email });
			expect(got?.responses).toEqual([]);
			expect(await store.get('nope')).toBeNull();
		});

		it('keeps one answer per person: answering again replaces it', async () => {
			const store = make();
			const { id } = await store.create(poll, vera);
			await store.respond(id, { email: 'ben@example.org', name: 'Ben', choices: { o1: 'yes', o2: 'no' }, updatedAt: '2027-01-01T10:00:00Z' });
			await store.respond(id, { email: 'ben@example.org', name: 'Ben', choices: { o1: 'maybe' }, comment: 'Nur vormittags', updatedAt: '2027-01-02T10:00:00Z' });
			await store.respond(id, { email: 'ada@example.org', name: 'Ada', choices: { o2: 'yes' }, updatedAt: '2027-01-02T11:00:00Z' });
			const { responses } = (await store.get(id))!;
			expect(responses.map((response) => [response.name, response.choices, response.comment])).toEqual([
				['Ada', { o2: 'yes' }, undefined],
				['Ben', { o1: 'maybe' }, 'Nur vormittags']
			]);
		});

		it('closes with the chosen date, reopens, and removes with its answers', async () => {
			const store = make();
			const { id } = await store.create(poll, vera);
			await store.respond(id, { email: 'ben@example.org', name: 'Ben', choices: { o1: 'yes' }, updatedAt: '2027-01-01T10:00:00Z' });
			await store.close(id, 'o1');
			expect((await store.get(id))?.poll).toMatchObject({ chosen: 'o1', closedAt: expect.any(String) });
			await store.reopen(id);
			expect((await store.get(id))?.poll.closedAt).toBeUndefined();
			await store.remove(id);
			expect(await store.get(id)).toBeNull();
			expect(await store.list()).toEqual([]);
		});
	});
}
