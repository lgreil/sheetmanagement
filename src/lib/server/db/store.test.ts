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

	it('remembers part checks, and dismissed hints until the file changes', async () => {
		const store = make();
		await store.savePartCheck({ fileId: 'f1', modified: '2026-10-01', pages: 4, skipped: false });
		await store.savePartCheck({ fileId: 'f2', modified: '2026-10-01', pages: null, skipped: false });
		await store.dismissPartCheck('f2');
		await store.savePartCheck({ fileId: 'f2', modified: '2026-10-01', pages: null, skipped: false });
		const byId = async () => new Map((await store.partChecks()).map((check) => [check.fileId, check]));
		expect((await byId()).get('f1')).toEqual({ fileId: 'f1', modified: '2026-10-01', pages: 4, skipped: false, dismissed: false });
		expect((await byId()).get('f2')?.dismissed).toBe(true);
		// A new version of the file is checked afresh.
		await store.savePartCheck({ fileId: 'f2', modified: '2026-10-20', pages: 3, skipped: false });
		expect((await byId()).get('f2')).toMatchObject({ pages: 3, dismissed: false });
		await store.clearPartChecks();
		expect(await store.partChecks()).toEqual([]);
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
		await store.deleteRemindersOf('a@x.org');
		expect(await store.remindersOf('a@x.org')).toEqual([]);
		expect(await store.remindersOf('b@x.org')).toHaveLength(1);
	});

	it('remembers who turned email reminders off (#123)', async () => {
		const store = make();
		await store.setMailOptOut('a@x.org', true);
		await store.setMailOptOut('a@x.org', true);
		await store.setMailOptOut('b@x.org', true);
		await store.setMailOptOut('b@x.org', false);
		expect(await store.mailOptOuts()).toEqual(new Set(['a@x.org']));
	});

	it('remembers how the tour ended, until it is forgotten', async () => {
		const store = make();
		expect(await store.tourOf('a@x.org')).toBeNull();
		await store.setTour('a@x.org', 'skipped');
		await store.setTour('a@x.org', 'done');
		await store.setTour('b@x.org', 'skipped');
		expect(await store.tourOf('a@x.org')).toBe('done');
		await store.setTour('b@x.org', null);
		expect(await store.tourOf('b@x.org')).toBeNull();
	});

	it('keeps practice time per member and day, capped per day, and only for that member', async () => {
		const store = make();
		expect(await store.practiceOn('a@x.org')).toBe(false);
		await store.setPracticeOn('a@x.org', true);
		await store.setPracticeOn('a@x.org', true);
		expect(await store.practiceOn('a@x.org')).toBe(true);
		expect(await store.practiceOn('b@x.org')).toBe(false);

		await store.addPractice('a@x.org', '2026-10-24', 30, 100);
		await store.addPractice('a@x.org', '2026-10-24', 60, 100);
		await store.addPractice('a@x.org', '2026-10-24', 60, 100);
		await store.addPractice('a@x.org', '2026-10-20', 45, 100);
		await store.addPractice('b@x.org', '2026-10-24', 500, 100);
		expect(await store.practiceOf('a@x.org')).toEqual([
			{ day: '2026-10-20', seconds: 45 },
			{ day: '2026-10-24', seconds: 100 }
		]);
		// One member's time is never part of another's.
		expect(await store.practiceOf('b@x.org')).toEqual([{ day: '2026-10-24', seconds: 100 }]);
		expect(await store.practiceOf('c@x.org')).toEqual([]);

		// Off keeps the time; deleting forgets it, only the member's own.
		await store.setPracticeOn('a@x.org', false);
		expect(await store.practiceOn('a@x.org')).toBe(false);
		expect((await store.practiceOf('a@x.org')).length).toBe(2);
		await store.deletePractice('a@x.org');
		expect(await store.practiceOf('a@x.org')).toEqual([]);
		expect((await store.practiceOf('b@x.org')).length).toBe(1);
	});

	it('keeps a member’s own marks per part and page, for that member only', async () => {
		const store = make();
		const line = (color: 'red' | 'blue') => [{ color, points: [0.1, 0.2, 0.3, 0.4] }];
		await store.saveMarks('a@x.org', 'file-1', 2, line('red'));
		await store.saveMarks('a@x.org', 'file-1', 1, line('blue'));
		await store.saveMarks('a@x.org', 'file-2', 1, line('red'));
		await store.saveMarks('b@x.org', 'file-1', 1, line('red'));
		// Saving a page again replaces it.
		await store.saveMarks('a@x.org', 'file-1', 2, line('blue'));
		expect(await store.marksOf('a@x.org', 'file-1')).toEqual([
			{ file: 'file-1', page: 1, strokes: line('blue') },
			{ file: 'file-1', page: 2, strokes: line('blue') }
		]);
		expect((await store.marksOf('a@x.org')).map((page) => `${page.file}:${page.page}`)).toEqual(['file-1:1', 'file-1:2', 'file-2:1']);
		// Another member's marks in the same part are theirs.
		expect(await store.marksOf('b@x.org', 'file-1')).toEqual([{ file: 'file-1', page: 1, strokes: line('red') }]);

		// No strokes forget the page; deleting forgets only the member's own.
		await store.saveMarks('a@x.org', 'file-1', 2, []);
		expect((await store.marksOf('a@x.org', 'file-1')).length).toBe(1);
		await store.deleteMarks('a@x.org');
		expect(await store.marksOf('a@x.org')).toEqual([]);
		expect((await store.marksOf('b@x.org')).length).toBe(1);
	});

	it('offers a member’s marks to their section until each answers, once per part', async () => {
		const store = make();
		const pages = { 1: [{ color: 'red' as const, points: [0.5, 0.5], symbol: 'downbow' as const }] };
		const first = await store.shareMarks('a@x.org', 'file-1', pages);
		expect(first).toMatchObject({ sender: 'a@x.org', file: 'file-1', pages });
		expect(await store.shareOf('a@x.org', 'file-1')).toMatchObject({ id: first.id });
		// Not to the member themself, nor in another part.
		expect(await store.sharesFor('a@x.org', 'file-1')).toEqual([]);
		expect(await store.sharesFor('b@x.org', 'file-2')).toEqual([]);
		expect((await store.sharesFor('b@x.org', 'file-1')).map((share) => share.id)).toEqual([first.id]);

		// Answered, it's gone for them, not for others.
		await store.answerShare(first.id, 'b@x.org', 'declined');
		expect(await store.sharesFor('b@x.org', 'file-1')).toEqual([]);
		expect((await store.sharesFor('c@x.org', 'file-1')).length).toBe(1);

		// Offered again, it replaces the first, and everyone answers anew.
		const again = await store.shareMarks('a@x.org', 'file-1', { 2: pages[1] });
		expect(await store.shareById(first.id)).toBeNull();
		expect((await store.sharesFor('b@x.org', 'file-1')).map((share) => share.pages)).toEqual([{ 2: pages[1] }]);
		expect(await store.shareById(again.id)).toMatchObject({ id: again.id });

		// Taken back, or with the member's marks deleted, it's gone.
		await store.unshareMarks('a@x.org', 'file-1');
		expect(await store.sharesFor('b@x.org', 'file-1')).toEqual([]);
		await store.shareMarks('a@x.org', 'file-1', pages);
		await store.deleteMarks('a@x.org');
		expect(await store.shareOf('a@x.org', 'file-1')).toBeNull();
	});

	it('groups errors by kind, until they are notified and forgotten (#191)', async () => {
		const store = make();
		const report = { source: 'server' as const, place: '/stuecke/[id]', message: 'Sheet unreadable', status: 500 };
		await store.logError(report);
		await store.logError(report);
		await store.logError({ ...report, source: 'client', status: undefined });
		const log = await store.errorLog(7);
		expect(log).toHaveLength(2);
		const server = log.find((group) => group.source === 'server')!;
		expect(server).toMatchObject({ place: '/stuecke/[id]', message: 'Sheet unreadable', status: 500, count: 2, notified: false });
		await store.markErrorsNotified([server.fingerprint]);
		expect((await store.errorLog(7)).filter((group) => group.notified)).toHaveLength(1);
		await store.pruneErrors(30);
		expect(await store.errorLog(7)).toHaveLength(2);
		await store.pruneErrors(0);
		expect(await store.errorLog(7)).toEqual([]);
	});

	it('counts uses for rate limits', async () => {
		const store = make();
		expect(await store.hit('mail:a@x.org', 60)).toBe(1);
		expect(await store.hit('mail:a@x.org', 60)).toBe(2);
		expect(await store.hit('mail:b@x.org', 60)).toBe(1);
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
