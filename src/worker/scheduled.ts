import { JOB_HEADER, jobTokens } from '../lib/server/jobs/token.ts';

interface Fetcher {
	fetch(request: Request, env: unknown, ctx: unknown): Promise<Response>;
}

/**
 * The worker's `scheduled` handler (#160). The jobs live in the SvelteKit app, so this
 * hands the run to the app's /api/jobs, in this isolate, with a one-time token that shows
 * the call is the trigger's own. Added to the worker by scripts/wrap-worker.mjs.
 */
export async function scheduled(kit: Fetcher, env: unknown, ctx: unknown): Promise<void> {
	const token = crypto.randomUUID();
	jobTokens().add(token);
	try {
		const response = await kit.fetch(
			// JSON, not a form: SvelteKit refuses cross-site form posts, and this has no origin.
			new Request('https://scheduled.invalid/api/jobs', {
				method: 'POST',
				headers: { [JOB_HEADER]: token, 'content-type': 'application/json' },
				body: '{}'
			}),
			env,
			ctx
		);
		const body = await response.text();
		if (!response.ok) throw new Error(`/api/jobs answered ${response.status}: ${body.slice(0, 200)}`);
		console.log('Jobs:', body);
	} finally {
		jobTokens().delete(token);
	}
}
