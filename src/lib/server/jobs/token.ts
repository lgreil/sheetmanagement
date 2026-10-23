/**
 * How the cron handler proves to /api/jobs that a call is its own (#160). The handler and
 * the app run in the same isolate, so it puts a one-time token into this set and sends it
 * along; a request from outside can't know it. No secret to configure. Shared by the app
 * and src/worker/scheduled.ts, so it imports nothing.
 */
export const JOB_HEADER = 'x-scheduled-job';

const KEY = '__notenJobTokens';

export function jobTokens(): Set<string> {
	const store = globalThis as unknown as Record<string, Set<string> | undefined>;
	return (store[KEY] ??= new Set());
}

export function isScheduledCall(request: Request): boolean {
	const token = request.headers.get(JOB_HEADER);
	return !!token && jobTokens().has(token);
}
