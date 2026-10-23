import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { memoryStore } from './memory.ts';
import { MIGRATIONS, sqlStore, statements, type D1, type D1Statement } from './sql.ts';

/** D1's API over Node's built-in SQLite, so the SQL and the migrations are tested for real. */
function localD1(): D1 {
	const db = new DatabaseSync(':memory:');
	const statement = (sql: string, values: unknown[] = []): D1Statement => ({
		bind: (...next) => statement(sql, next),
		all: async <T>() => ({ results: db.prepare(sql).all(...values) as T[] }),
		first: async <T>() => (db.prepare(sql).get(...values) as T) ?? null,
		run: async () => db.prepare(sql).run(...values)
	});
	return {
		prepare: (sql) => statement(sql),
		async batch(list) {
			db.exec('BEGIN');
			try {
				const results = [];
				for (const item of list) results.push(await item.run());
				db.exec('COMMIT');
				return results;
			} catch (cause) {
				db.exec('ROLLBACK');
				throw cause;
			}
		}
	};
}

const device = (endpoint: string, email: string) => ({ endpoint, email, p256dh: 'key', auth: 'secret' });

describe.each([
	['d1', () => sqlStore(localD1())],
	['memory', () => memoryStore()]
])('%s store', (_, make) => {
	it('keeps one row per device and finds a member’s devices', async () => {
		const store = make();
		await store.savePush(device('https://push/1', 'a@x.org'));
		await store.savePush(device('https://push/2', 'a@x.org'));
		await store.savePush(device('https://push/3', 'b@x.org'));
		// The same device signed in as someone else: it moves.
		await store.savePush(device('https://push/2', 'b@x.org'));
		expect((await store.pushOf('a@x.org')).map((d) => d.endpoint)).toEqual(['https://push/1']);
		expect((await store.allPush()).length).toBe(3);
		expect((await store.pushOf('b@x.org'))[0].createdAt).toMatch(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
		await store.deletePush('https://push/1');
		expect(await store.pushOf('a@x.org')).toEqual([]);
	});

	it('logs each reminder once', async () => {
		const store = make();
		await store.logReminder('signup', 'event-1', 'a@x.org');
		await store.logReminder('signup', 'event-1', 'a@x.org');
		await store.logReminder('loan', 'event-1', 'b@x.org');
		expect(await store.sentReminders('signup', ['event-1', 'event-2'])).toEqual(new Set(['event-1\na@x.org']));
		expect(await store.sentReminders('signup', [])).toEqual(new Set());
		// For the member's data export: their own reminders only, with the time sent.
		const mine = await store.remindersOf('a@x.org');
		expect(mine.map(({ kind, subject }) => [kind, subject])).toEqual([['signup', 'event-1']]);
		expect(mine[0].sentAt).toMatch(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
		expect(await store.remindersOf('nobody@x.org')).toEqual([]);
	});

	it('keeps values between runs', async () => {
		const store = make();
		expect(await store.getState('check')).toBeNull();
		await store.setState('check', 'ok');
		await store.setState('check', 'failed');
		expect(await store.getState('check')).toBe('failed');
	});

	it('creates its schema on first use', async () => {
		const store = make();
		await store.getState('anything');
		expect(await store.schemaVersion()).toBe(MIGRATIONS.at(-1)?.[0]);
	});
});

describe('migrations', () => {
	it('are found and split into statements', () => {
		expect(MIGRATIONS.map(([name]) => name)).toContain('0001_reminders.sql');
		expect(statements('-- a comment; with a semicolon\nCREATE TABLE a (x);\n\nCREATE TABLE b (y);\n')).toEqual(['CREATE TABLE a (x)', 'CREATE TABLE b (y)']);
	});

	it('run once, also when started twice', async () => {
		const store = sqlStore(localD1());
		expect(await store.migrate()).toEqual(MIGRATIONS.map(([name]) => name));
		expect(await store.migrate()).toEqual([]);
	});
});
