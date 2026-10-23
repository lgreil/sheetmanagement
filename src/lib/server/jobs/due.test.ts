import { describe, expect, it, vi } from 'vitest';

vi.mock('../env.ts', () => ({ appEnv: () => ({}) }));
vi.mock('./warm.ts', () => ({ warmCaches: vi.fn() }));

const { dueJobs } = await import('./index.ts');

const minutes = (n: number) => n * 60 * 1000;
const run = (at: number) => ({ at, ms: 10, ok: true, summary: '', auto: true });

describe('dueJobs', () => {
	const now = minutes(1000);

	it('runs a job that never ran', () => {
		expect(dueJobs({}, now)).toEqual(['warm']);
	});

	it('waits until the interval has passed, with a minute of slack', () => {
		expect(dueJobs({ warm: run(now - minutes(5)) }, now)).toEqual([]);
		// The trigger fires a few seconds early: still due.
		expect(dueJobs({ warm: run(now - minutes(10) + 20_000) }, now)).toEqual(['warm']);
		expect(dueJobs({ warm: run(now - minutes(30)) }, now)).toEqual(['warm']);
	});
});
