import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cached, CacheTimeoutError, clearMemoryCache, patchCached, type KvStore } from './cache.ts';

function memoryKv(): KvStore & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return {
		data,
		async get(key) {
			const value = data.get(key);
			return value === undefined ? null : JSON.parse(value);
		},
		async put(key, value) {
			data.set(key, value);
		}
	};
}

describe('cached', () => {
	beforeEach(() => clearMemoryCache());

	it('builds once, then serves from memory while fresh', async () => {
		const build = vi.fn(async () => 'v1');
		const options = { key: 'k', maxAgeMs: 1000, build, now: () => 0 };

		expect(await cached(options)).toMatchObject({ value: 'v1', source: 'fresh' });
		expect(await cached(options)).toMatchObject({ value: 'v1', source: 'memory' });
		expect(build).toHaveBeenCalledTimes(1);
	});

	it('serves a stale value at once and refreshes in the background', async () => {
		let time = 0;
		let version = 0;
		const background: Promise<unknown>[] = [];
		const options = {
			key: 'k',
			maxAgeMs: 1000,
			build: async () => `v${++version}`,
			now: () => time,
			waitUntil: (p: Promise<unknown>) => background.push(p)
		};

		await cached(options);
		time = 5000;
		expect(await cached(options)).toMatchObject({ value: 'v1', source: 'memory' });
		expect(background).toHaveLength(1);
		await Promise.all(background);
		expect(await cached(options)).toMatchObject({ value: 'v2' });
	});

	it('uses KV when memory is empty, e.g. in a new Worker instance', async () => {
		const kv = memoryKv();
		await cached({ key: 'k', maxAgeMs: 1000, build: async () => 'shared', kv, now: () => 0 });
		clearMemoryCache();

		const build = vi.fn(async () => 'rebuilt');
		expect(await cached({ key: 'k', maxAgeMs: 1000, build, kv, now: () => 10 })).toMatchObject({
			value: 'shared',
			source: 'kv'
		});
		expect(build).not.toHaveBeenCalled();
	});

	it('rebuilds immediately when forced', async () => {
		const kv = memoryKv();
		await cached({ key: 'k', maxAgeMs: 1000, build: async () => 'old', kv, now: () => 0 });
		const result = await cached({ key: 'k', maxAgeMs: 1000, build: async () => 'new', kv, now: () => 1, force: true });
		expect(result).toMatchObject({ value: 'new', source: 'fresh' });
		expect(JSON.parse(kv.data.get('k')!).value).toBe('new');
	});

	it('starts a new build when forced, even while one is running', async () => {
		let release!: (value: string) => void;
		const slow = cached({ key: 'k', maxAgeMs: 1000, build: () => new Promise<string>((r) => (release = r)) });
		await new Promise((r) => setTimeout(r, 0));
		const forced = await cached({ key: 'k', maxAgeMs: 1000, build: async () => 'after write', force: true });
		expect(forced.value).toBe('after write');
		release('before write');
		await slow;
	});

	it('gives up on a build that never finishes, and the next call starts over', async () => {
		const stuck = cached({ key: 'k', maxAgeMs: 1000, build: () => new Promise<string>(() => {}), timeoutMs: 20 });
		await expect(stuck).rejects.toThrow(CacheTimeoutError);

		await new Promise((r) => setTimeout(r, 25));
		const result = await cached({ key: 'k', maxAgeMs: 1000, build: async () => 'ok', timeoutMs: 20 });
		expect(result).toMatchObject({ value: 'ok', source: 'fresh' });
	});

	it('writes to KV only when the value changed', async () => {
		const kv = memoryKv();
		const put = vi.spyOn(kv, 'put');
		let time = 0;
		const options = { key: 'k', maxAgeMs: 10, build: async () => 'same', kv, now: () => time };
		await cached(options);
		time = 100;
		await cached({ ...options, force: true });
		await cached({ ...options, build: async () => 'changed', force: true });
		expect(put).toHaveBeenCalledTimes(2);
	});
});

describe('patchCached', () => {
	beforeEach(() => clearMemoryCache());

	it('changes the cached value in memory and KV, keeping its age', async () => {
		const kv = memoryKv();
		const build = vi.fn(async () => ['a', 'b']);
		const options = { key: 'k', maxAgeMs: 1000, build, kv, now: () => 5 };
		await cached(options);

		expect(await patchCached<string[]>({ key: 'k', kv, update: (value) => value.map((v) => v.toUpperCase()) })).toBe(true);
		expect(await cached(options)).toMatchObject({ value: ['A', 'B'], storedAt: 5, source: 'memory' });
		expect(JSON.parse(kv.data.get('k')!)).toEqual({ storedAt: 5, value: ['A', 'B'] });
		expect(build).toHaveBeenCalledTimes(1);
	});

	it('does nothing when nothing is cached', async () => {
		expect(await patchCached<string>({ key: 'k', update: () => 'x' })).toBe(false);
	});

	it('waits for a refresh that is running, so it does not bring the old value back', async () => {
		let release!: (value: string) => void;
		const running = cached({ key: 'k', maxAgeMs: 1000, build: () => new Promise<string>((r) => (release = r)) });
		await new Promise((r) => setTimeout(r, 0));
		const patch = patchCached<string>({ key: 'k', update: (value) => `${value} patched` });
		release('old');
		await running;
		await patch;
		expect(await cached({ key: 'k', maxAgeMs: 1000, build: async () => 'rebuilt' })).toMatchObject({ value: 'old patched' });
	});
});
