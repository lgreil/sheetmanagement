// Node's built-in SQLite, used by store.test.ts to run the store's SQL for real; the app has
// no Node type definitions.
declare module 'node:sqlite' {
	interface StatementSync {
		all(...values: unknown[]): unknown[];
		get(...values: unknown[]): unknown;
		run(...values: unknown[]): unknown;
	}
	export class DatabaseSync {
		constructor(path: string);
		exec(sql: string): void;
		prepare(sql: string): StatementSync;
	}
}
