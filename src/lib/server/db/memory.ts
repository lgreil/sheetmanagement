import { reminderKey, type PageMarks, type PartCheck, type PushDevice, type Store, type TourOutcome } from './types.ts';
import { MIGRATIONS } from './sql.ts';

/** Like SQLite's datetime('now'). */
const sqlTime = (at: number) => new Date(at).toISOString().slice(0, 19).replace('T', ' ');

/** The store without D1: demo, tests, dev without Wrangler. Gone on restart, like the demo's sheet. */
export function memoryStore(now = () => Date.now()): Store {
	const push = new Map<string, PushDevice>();
	const sent = new Map<string, number>();
	const state = new Map<string, string>();
	const optOut = new Set<string>();
	const tours = new Map<string, TourOutcome>();
	const practiceOptIn = new Set<string>();
	/** Seconds by member, then by day. */
	const practice = new Map<string, Map<string, number>>();
	/** Marks by member, then by `${page} ${file}`. */
	const marks = new Map<string, Map<string, PageMarks>>();
	const hits = new Map<string, { count: number; since: number }>();
	const partChecks = new Map<string, PartCheck>();
	const latest = MIGRATIONS.at(-1)?.[0] ?? null;

	return {
		kind: 'memory',
		schemaVersion: async () => latest,
		migrate: async () => [],

		async savePush(device) {
			push.set(device.endpoint, { ...device, createdAt: push.get(device.endpoint)?.createdAt ?? sqlTime(now()) });
		},
		async deletePush(endpoint) {
			push.delete(endpoint);
		},
		pushOf: async (email) => [...push.values()].filter((device) => device.email === email),
		allPush: async () => [...push.values()],

		async sentReminders(kind, subjects) {
			const wanted = new Set(subjects);
			return new Set(
				[...sent.keys()].filter((key) => key.startsWith(`${kind}\n`) && wanted.has(key.split('\n')[1])).map((key) => key.slice(kind.length + 1))
			);
		},
		async logReminder(kind, subject, recipient) {
			const key = `${kind}\n${reminderKey(subject, recipient)}`;
			if (!sent.has(key)) sent.set(key, now());
		},
		async remindersOf(recipient) {
			return [...sent]
				.map(([key, at]) => ({ parts: key.split('\n'), at }))
				.filter(({ parts }) => parts[2] === recipient)
				.map(({ parts, at }) => ({ kind: parts[0], subject: parts[1], sentAt: sqlTime(at) }));
		},
		async deleteRemindersOf(recipient) {
			for (const key of sent.keys()) if (key.split('\n')[2] === recipient) sent.delete(key);
		},
		async pruneReminders(days) {
			for (const [key, at] of sent) if (at < now() - days * 86_400_000) sent.delete(key);
		},

		mailOptOuts: async () => new Set(optOut),
		async setMailOptOut(email, off) {
			if (off) optOut.add(email);
			else optOut.delete(email);
		},

		tourOf: async (email) => tours.get(email) ?? null,
		async setTour(email, outcome) {
			if (outcome) tours.set(email, outcome);
			else tours.delete(email);
		},

		practiceOn: async (email) => practiceOptIn.has(email),
		async setPracticeOn(email, on) {
			if (on) practiceOptIn.add(email);
			else practiceOptIn.delete(email);
		},
		async addPractice(email, day, seconds, cap) {
			const days = practice.get(email) ?? new Map<string, number>();
			days.set(day, Math.min(cap, (days.get(day) ?? 0) + seconds));
			practice.set(email, days);
		},
		practiceOf: async (email) =>
			[...(practice.get(email) ?? [])].map(([day, seconds]) => ({ day, seconds })).sort((a, b) => a.day.localeCompare(b.day)),
		async deletePractice(email) {
			practice.delete(email);
		},
		marksOf: async (email, file) =>
			[...(marks.get(email)?.values() ?? [])]
				.filter((page) => file === undefined || page.file === file)
				.sort((a, b) => a.file.localeCompare(b.file) || a.page - b.page),
		async saveMarks(email, file, page, strokes) {
			const pages = marks.get(email) ?? new Map<string, PageMarks>();
			if (strokes.length) pages.set(`${page} ${file}`, { file, page, strokes });
			else pages.delete(`${page} ${file}`);
			marks.set(email, pages);
		},
		async deleteMarks(email) {
			marks.delete(email);
		},

		partChecks: async () => [...partChecks.values()],
		async savePartCheck(check) {
			const old = partChecks.get(check.fileId);
			partChecks.set(check.fileId, { ...check, dismissed: !!old?.dismissed && old.modified === check.modified });
		},
		async dismissPartCheck(fileId) {
			const old = partChecks.get(fileId);
			if (old) partChecks.set(fileId, { ...old, dismissed: true });
		},
		async clearPartChecks() {
			partChecks.clear();
		},

		async hit(key, windowMinutes) {
			const last = hits.get(key);
			const next = last && last.since >= now() - windowMinutes * 60_000 ? { ...last, count: last.count + 1 } : { count: 1, since: now() };
			hits.set(key, next);
			return next.count;
		},

		getState: async (key) => state.get(key) ?? null,
		async setState(key, value) {
			state.set(key, value);
		}
	};
}
