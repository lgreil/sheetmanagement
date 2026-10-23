import { reminderKey, type PushDevice, type SentReminder, type Store, type TourOutcome } from './types.ts';

/** The part of a Cloudflare D1 binding this app uses. Plain SQL, no ORM. */
export interface D1 {
	prepare(sql: string): D1Statement;
	batch(statements: D1Statement[]): Promise<unknown[]>;
}

export interface D1Statement {
	bind(...values: unknown[]): D1Statement;
	all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
	first<T = Record<string, unknown>>(): Promise<T | null>;
	run(): Promise<unknown>;
}

/** The files in migrations/, by name, in order. The same files `wrangler d1 migrations apply` uses. */
export const MIGRATIONS: [name: string, sql: string][] = Object.entries(
	import.meta.glob<string>('/migrations/*.sql', { query: '?raw', import: 'default', eager: true })
)
	.map(([path, sql]): [string, string] => [path.split('/').pop()!, sql])
	.sort(([a], [b]) => a.localeCompare(b));

/** Wrangler's own bookkeeping table, so the app and `wrangler d1 migrations apply` agree on what ran. */
const BOOKKEEPING = `CREATE TABLE IF NOT EXISTS d1_migrations(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT UNIQUE,
	applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
)`;

/** A migration file as single statements: D1 prepares one at a time. */
export function statements(sql: string): string[] {
	return sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n')
		.split(';')
		.map((statement) => statement.trim())
		.filter(Boolean);
}

export function sqlStore(db: D1): Store {
	// Once per isolate: the schema is checked before the first query, not on every one.
	let ready: Promise<unknown> | undefined;
	const schema = () => (ready ??= migrate().catch((cause: unknown) => ((ready = undefined), Promise.reject(cause))));
	const all = async <T>(sql: string, ...values: unknown[]) => (await schema(), (await db.prepare(sql).bind(...values).all<T>()).results);
	const run = async (sql: string, ...values: unknown[]) => (await schema(), await db.prepare(sql).bind(...values).run());

	async function applied(): Promise<string[]> {
		await db.prepare(BOOKKEEPING).run();
		return (await db.prepare('SELECT name FROM d1_migrations ORDER BY id').all<{ name: string }>()).results.map((row) => row.name);
	}

	async function migrate(): Promise<string[]> {
		const done = new Set(await applied());
		const added: string[] = [];
		for (const [name, sql] of MIGRATIONS) {
			if (done.has(name)) continue;
			// One batch is one transaction: the tables and the bookkeeping row land together.
			try {
				await db.batch([...statements(sql).map((statement) => db.prepare(statement)), db.prepare('INSERT INTO d1_migrations (name) VALUES (?)').bind(name)]);
				added.push(name);
			} catch (cause) {
				// Another instance applied it at the same moment: fine, the statements are idempotent.
				if (!(await applied()).includes(name)) throw cause;
			}
		}
		return added;
	}

	return {
		kind: 'd1',
		async schemaVersion() {
			return (await applied()).at(-1) ?? null;
		},
		migrate,

		async savePush(device) {
			await run(
				`INSERT INTO push_subscriptions (endpoint, email, p256dh, auth) VALUES (?, ?, ?, ?)
				 ON CONFLICT (endpoint) DO UPDATE SET email = excluded.email, p256dh = excluded.p256dh, auth = excluded.auth`,
				device.endpoint,
				device.email,
				device.p256dh,
				device.auth
			);
		},
		async deletePush(endpoint) {
			await run('DELETE FROM push_subscriptions WHERE endpoint = ?', endpoint);
		},
		pushOf: (email) =>
			all<PushDevice>('SELECT endpoint, email, p256dh, auth, created_at AS createdAt FROM push_subscriptions WHERE email = ? ORDER BY created_at', email),
		allPush: () => all<PushDevice>('SELECT endpoint, email, p256dh, auth FROM push_subscriptions ORDER BY email, created_at'),

		async sentReminders(kind, subjects) {
			const sent = new Set<string>();
			// D1 binds at most 100 values per statement.
			for (let i = 0; i < subjects.length; i += 90) {
				const chunk = subjects.slice(i, i + 90);
				const rows = await all<{ subject: string; recipient: string }>(
					`SELECT subject, recipient FROM reminders_sent WHERE kind = ? AND subject IN (${chunk.map(() => '?').join(', ')})`,
					kind,
					...chunk
				);
				for (const row of rows) sent.add(reminderKey(row.subject, row.recipient));
			}
			return sent;
		},
		async logReminder(kind, subject, recipient) {
			await run('INSERT OR IGNORE INTO reminders_sent (kind, subject, recipient) VALUES (?, ?, ?)', kind, subject, recipient);
		},
		remindersOf: (recipient) =>
			all<SentReminder>('SELECT kind, subject, sent_at AS sentAt FROM reminders_sent WHERE recipient = ? ORDER BY sent_at, kind, subject', recipient),
		async pruneReminders(days) {
			await run(`DELETE FROM reminders_sent WHERE sent_at < datetime('now', ?)`, `-${days} days`);
		},

		async mailOptOuts() {
			return new Set((await all<{ email: string }>('SELECT email FROM email_opt_out')).map((row) => row.email));
		},
		async setMailOptOut(email, off) {
			if (off) await run('INSERT OR IGNORE INTO email_opt_out (email) VALUES (?)', email);
			else await run('DELETE FROM email_opt_out WHERE email = ?', email);
		},

		async tourOf(email) {
			const [row] = await all<{ outcome: TourOutcome }>('SELECT outcome FROM tour_seen WHERE email = ?', email);
			return row?.outcome ?? null;
		},
		async setTour(email, outcome) {
			if (outcome) await run(`INSERT INTO tour_seen (email, outcome) VALUES (?, ?) ON CONFLICT (email) DO UPDATE SET outcome = excluded.outcome, created_at = datetime('now')`, email, outcome);
			else await run('DELETE FROM tour_seen WHERE email = ?', email);
		},

		async hit(key, windowMinutes) {
			const since = `-${windowMinutes} minutes`;
			const [row] = await all<{ count: number }>(
				`INSERT INTO rate_limits (key, count) VALUES (?, 1)
				 ON CONFLICT (key) DO UPDATE SET
					count = CASE WHEN window_start < datetime('now', ?) THEN 1 ELSE count + 1 END,
					window_start = CASE WHEN window_start < datetime('now', ?) THEN datetime('now') ELSE window_start END
				 RETURNING count`,
				key,
				since,
				since
			);
			// Old windows are of no use any more; a day covers every limit the app has.
			await run(`DELETE FROM rate_limits WHERE window_start < datetime('now', '-1 day')`);
			return row?.count ?? 1;
		},

		async getState(key) {
			await schema();
			return (await db.prepare('SELECT value FROM job_state WHERE key = ?').bind(key).first<{ value: string }>())?.value ?? null;
		},
		async setState(key, value) {
			await run(
				`INSERT INTO job_state (key, value) VALUES (?, ?)
				 ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
				key,
				value
			);
		}
	};
}
