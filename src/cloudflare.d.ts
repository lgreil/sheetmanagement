// Minimal typing for the Workers runtime module we use. Kept by hand instead of
// `wrangler types`, whose generated file pulls the build output into type checks.
declare module 'cloudflare:workers' {
	export const env: Record<string, unknown>;
	export function waitUntil(promise: Promise<unknown>): void;
	export abstract class DurableObject<Env = unknown> {
		protected ctx: unknown;
		protected env: Env;
		constructor(ctx: unknown, env: Env);
	}
}

// Enabled by the nodejs_als compatibility flag; the app has no Node type definitions.
declare module 'node:async_hooks' {
	export class AsyncLocalStorage<T> {
		getStore(): T | undefined;
		run<R>(store: T, fn: () => R): R;
	}
}
