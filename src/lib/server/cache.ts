/** The part of a Cloudflare KV namespace binding this app uses. */
export interface KvStore {
	get(key: string, type: 'json'): Promise<unknown>;
	put(key: string, value: string): Promise<void>;
}

interface Entry<T> {
	storedAt: number;
	value: T;
}

export interface CachedOptions<T> {
	key: string;
	/** After this age the value is refreshed in the background (stale-while-revalidate). */
	maxAgeMs: number;
	build: () => Promise<T>;
	/** Persistent store shared by all Worker instances. Without it, only memory is used. */
	kv?: KvStore;
	/** Keeps the Worker alive for a background refresh after the response is sent. */
	waitUntil?: (promise: Promise<unknown>) => void;
	now?: () => number;
	/** Rebuild now and wait for it, ignoring cached values and refreshes already running. */
	force?: boolean;
	/** How long a caller waits for a build before giving up. */
	timeoutMs?: number;
}

export interface CachedResult<T> {
	value: T;
	storedAt: number;
	source: 'memory' | 'kv' | 'fresh';
}

export class CacheTimeoutError extends Error {
	constructor(key: string, ms: number) {
		super(`Building ${key} took longer than ${ms} ms`);
		this.name = 'CacheTimeoutError';
	}
}

/**
 * Well below the 30 seconds Cloudflare gives background work (waitUntil) after the
 * response, so a page never waits for a refresh that the runtime will cancel anyway.
 */
const DEFAULT_TIMEOUT_MS = 20_000;

const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, { promise: Promise<Entry<unknown>>; startedAt: number }>();
/** What was last written to KV per key, so unchanged values aren't written again (free tier: 1,000 writes a day). */
const persisted = new Map<string, string>();

/**
 * Waits for a build, but not forever. In Workers, a promise whose I/O belongs to another
 * request never settles once that request is gone (e.g. a background refresh that
 * Cloudflare cancelled). Without a limit every later visitor would wait for it too.
 */
function withTimeout<T>(promise: Promise<T>, key: string, ms: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new CacheTimeoutError(key, ms)), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Two cache levels: memory (per Worker instance) and KV (shared, survives restarts).
 * Stale values are returned at once and refreshed in the background, so visitors
 * only wait for Google when there is no cached value at all.
 */
export async function cached<T>(options: CachedOptions<T>): Promise<CachedResult<T>> {
	const { key, maxAgeMs, kv, waitUntil, force = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
	const now = options.now ?? Date.now;

	const refresh = (fresh: boolean): Promise<Entry<T>> => {
		const running = inflight.get(key);
		// A refresh that's been running too long is stuck (see withTimeout); start over.
		if (running && !fresh && Date.now() - running.startedAt < timeoutMs) {
			return withTimeout(running.promise as Promise<Entry<T>>, key, timeoutMs);
		}
		const promise: Promise<Entry<T>> = (async () => {
			const entry: Entry<T> = { storedAt: now(), value: await options.build() };
			memory.set(key, entry);
			if (kv) {
				const json = JSON.stringify(entry.value);
				if (persisted.get(key) !== json) {
					await kv.put(key, `{"storedAt":${entry.storedAt},"value":${json}}`);
					persisted.set(key, json);
				}
			}
			return entry;
		})().finally(() => {
			if (inflight.get(key)?.promise === promise) inflight.delete(key);
		});
		inflight.set(key, { promise, startedAt: Date.now() });
		return withTimeout(promise, key, timeoutMs);
	};

	const isFresh = (entry: Entry<T>) => now() - entry.storedAt < maxAgeMs;
	const serve = (entry: Entry<T>, source: CachedResult<T>['source']): CachedResult<T> => {
		if (!isFresh(entry)) {
			const background = refresh(false).catch((error) => console.error(`Refreshing ${key} failed:`, error));
			waitUntil?.(background);
		}
		return { value: entry.value, storedAt: entry.storedAt, source };
	};

	if (!force) {
		const inMemory = memory.get(key) as Entry<T> | undefined;
		if (inMemory) return serve(inMemory, 'memory');

		const stored = (await kv?.get(key, 'json').catch(() => null)) as Entry<T> | null | undefined;
		if (stored && typeof stored.storedAt === 'number') {
			memory.set(key, stored);
			return serve(stored, 'kv');
		}
	}

	// Forced: after a write, a refresh that started before it would bring old data.
	const fresh = await refresh(force);
	return { value: fresh.value, storedAt: fresh.storedAt, source: 'fresh' };
}

/** For tests only. */
export function clearMemoryCache() {
	memory.clear();
	inflight.clear();
	persisted.clear();
}
