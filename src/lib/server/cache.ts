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
	/** Rebuild now and wait for it, ignoring cached values. */
	force?: boolean;
}

export interface CachedResult<T> {
	value: T;
	storedAt: number;
	source: 'memory' | 'kv' | 'fresh';
}

const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<Entry<unknown>>>();

/**
 * Two cache levels: memory (per Worker instance) and KV (shared, survives restarts).
 * Stale values are returned at once and refreshed in the background, so visitors
 * only wait for Google when there is no cached value at all.
 */
export async function cached<T>(options: CachedOptions<T>): Promise<CachedResult<T>> {
	const { key, maxAgeMs, kv, waitUntil } = options;
	const now = options.now ?? Date.now;

	const refresh = () => {
		let promise = inflight.get(key) as Promise<Entry<T>> | undefined;
		if (!promise) {
			promise = (async () => {
				const entry: Entry<T> = { storedAt: now(), value: await options.build() };
				memory.set(key, entry);
				await kv?.put(key, JSON.stringify(entry));
				return entry;
			})().finally(() => inflight.delete(key));
			inflight.set(key, promise);
		}
		return promise;
	};

	const isFresh = (entry: Entry<T>) => now() - entry.storedAt < maxAgeMs;
	const serve = (entry: Entry<T>, source: CachedResult<T>['source']): CachedResult<T> => {
		if (!isFresh(entry)) {
			const background = refresh().catch((error) => console.error(`Refreshing ${key} failed:`, error));
			waitUntil?.(background);
		}
		return { value: entry.value, storedAt: entry.storedAt, source };
	};

	if (!options.force) {
		const inMemory = memory.get(key) as Entry<T> | undefined;
		if (inMemory) return serve(inMemory, 'memory');

		const stored = (await kv?.get(key, 'json').catch(() => null)) as Entry<T> | null | undefined;
		if (stored && typeof stored.storedAt === 'number') {
			memory.set(key, stored);
			return serve(stored, 'kv');
		}
	}

	const fresh = await refresh();
	return { value: fresh.value, storedAt: fresh.storedAt, source: 'fresh' };
}

/** For tests only. */
export function clearMemoryCache() {
	memory.clear();
	inflight.clear();
}
