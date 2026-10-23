import { DurableObject } from 'cloudflare:workers';
import { LockQueue } from '../lib/server/lock-queue.ts';

/**
 * The queue for writes to the Repertoire sheet (#156): one instance per deployment, so
 * saves from different Worker instances run one after another. It only hands out turns;
 * the writes themselves stay in the app (src/lib/server/sheet-lock.ts). The state is in
 * memory: if the object restarts, the queue starts empty, which at worst lets two writes
 * overlap as they did before.
 *
 * Exported from the deployed worker by scripts/wrap-worker.mjs; bound as SHEET_LOCK.
 */
export class SheetWriteLock extends DurableObject {
	#queue = new LockQueue();

	acquire(leaseMs: number, waitMs: number): Promise<string | undefined> {
		return this.#queue.acquire(leaseMs, waitMs);
	}

	release(ticket: string): void {
		this.#queue.release(ticket);
	}
}
