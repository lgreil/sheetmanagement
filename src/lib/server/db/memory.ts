import { reminderKey, type PushDevice, type Store } from './types.ts';
import { MIGRATIONS } from './sql.ts';

/** Like SQLite's datetime('now'). */
const sqlTime = (at: number) => new Date(at).toISOString().slice(0, 19).replace('T', ' ');

/** The store without D1: demo, tests, dev without Wrangler. Gone on restart, like the demo's sheet. */
export function memoryStore(now = () => Date.now()): Store {
	const push = new Map<string, PushDevice>();
	const sent = new Map<string, number>();
	const state = new Map<string, string>();
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
		async pruneReminders(days) {
			for (const [key, at] of sent) if (at < now() - days * 86_400_000) sent.delete(key);
		},

		getState: async (key) => state.get(key) ?? null,
		async setState(key, value) {
			state.set(key, value);
		}
	};
}
