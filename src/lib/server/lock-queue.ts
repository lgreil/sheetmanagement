/**
 * One holder at a time, the others wait in order (#156). Lives in the SheetWriteLock
 * Durable Object; kept free of Workers APIs so it can be tested on its own. A holder
 * that never releases (its Worker died) loses the lock after its lease; a waiter that
 * waited too long gets no ticket and gives up.
 */
export class LockQueue {
	#holder: { ticket: string; timer: ReturnType<typeof setTimeout> } | undefined;
	#waiting: { ticket: string; leaseMs: number; grant: () => void }[] = [];

	/** Resolves with a ticket once it's this caller's turn, or with undefined after waitMs. */
	acquire(leaseMs: number, waitMs: number): Promise<string | undefined> {
		const ticket = crypto.randomUUID();
		if (!this.#holder) {
			this.#hold(ticket, leaseMs);
			return Promise.resolve(ticket);
		}
		return new Promise((resolve) => {
			const timer = setTimeout(() => {
				this.#waiting = this.#waiting.filter((waiter) => waiter.ticket !== ticket);
				resolve(undefined);
			}, waitMs);
			this.#waiting.push({
				ticket,
				leaseMs,
				grant: () => {
					clearTimeout(timer);
					resolve(ticket);
				}
			});
		});
	}

	/** Hands the lock to the next waiter. A stale ticket (lease ran out) does nothing. */
	release(ticket: string): void {
		if (this.#holder?.ticket !== ticket) return;
		clearTimeout(this.#holder.timer);
		this.#holder = undefined;
		const next = this.#waiting.shift();
		if (!next) return;
		this.#hold(next.ticket, next.leaseMs);
		next.grant();
	}

	#hold(ticket: string, leaseMs: number) {
		this.#holder = { ticket, timer: setTimeout(() => this.release(ticket), leaseMs) };
	}
}
