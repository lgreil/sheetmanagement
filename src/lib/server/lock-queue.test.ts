import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LockQueue } from './lock-queue.ts';

describe('LockQueue', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('gives turns one after another, in order', async () => {
		const queue = new LockQueue();
		const first = await queue.acquire(1000, 1000);
		const order: string[] = [];
		const second = queue.acquire(1000, 1000).then((ticket) => (order.push('second'), ticket));
		const third = queue.acquire(1000, 1000).then((ticket) => (order.push('third'), ticket));
		await vi.advanceTimersByTimeAsync(10);
		expect(order).toEqual([]);
		queue.release(first!);
		const ticket = await second;
		expect(order).toEqual(['second']);
		queue.release(ticket!);
		expect(await third).toBeTruthy();
		expect(order).toEqual(['second', 'third']);
	});

	it('frees the lock when the holder never releases it', async () => {
		const queue = new LockQueue();
		await queue.acquire(500, 1000);
		const next = queue.acquire(500, 1000);
		await vi.advanceTimersByTimeAsync(500);
		expect(await next).toBeTruthy();
	});

	it('gives up after the wait, and a late release changes nothing', async () => {
		const queue = new LockQueue();
		const holder = await queue.acquire(5000, 1000);
		const waiter = queue.acquire(5000, 1000);
		await vi.advanceTimersByTimeAsync(1000);
		expect(await waiter).toBeUndefined();
		queue.release('stale');
		const after = queue.acquire(5000, 1000);
		queue.release(holder!);
		expect(await after).toBeTruthy();
	});
});
