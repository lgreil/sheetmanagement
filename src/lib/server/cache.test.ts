import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cached, clearMemoryCache, type KvStore } from './cache.ts';

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
});
