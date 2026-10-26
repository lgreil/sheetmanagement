import { REPOSITORY } from '#lib/version.ts';

/**
 * Whether the deployed commit is the newest on GitHub (#206), for /status. GitHub's compare
 * API needs no key; without one it allows 60 calls an hour, so a Worker instance remembers the
 * answer for an hour. Unreachable or unknown: null, and /status says it couldn't check.
 */

export interface Freshness {
	/** Commits on main that aren't deployed. */
	behind: number;
	/** Commits deployed that aren't on main, e.g. from a branch or a fork. */
	ahead: number;
	/** GitHub's page comparing the two. */
	url: string;
}

const KEEP_MS = 60 * 60 * 1000;
const known = new Map<string, { at: number; value: Freshness | null }>();

/** "https://github.com/a/b" → "https://api.github.com/repos/a/b" */
const api = (repository: string) => repository.replace('https://github.com/', 'https://api.github.com/repos/');

export async function freshness(commit: string, { branch = 'main', fetcher = fetch, now = Date.now() } = {}): Promise<Freshness | null> {
	if (!/^[0-9a-f]{7,40}$/i.test(commit)) return null;
	const cached = known.get(commit);
	if (cached && now - cached.at < KEEP_MS) return cached.value;
	let value: Freshness | null = null;
	try {
		const response = await fetcher(`${api(REPOSITORY)}/compare/${commit}...${branch}`, {
			headers: { accept: 'application/vnd.github+json', 'user-agent': 'sheetmanagement' },
			signal: AbortSignal.timeout(5000)
		});
		if (response.ok) {
			const body = (await response.json()) as { ahead_by?: number; behind_by?: number; html_url?: string };
			// Comparing commit...main: main is "ahead" by what isn't deployed yet.
			value = { behind: body.ahead_by ?? 0, ahead: body.behind_by ?? 0, url: body.html_url ?? `${REPOSITORY}/compare/${commit}...${branch}` };
		}
	} catch (error) {
		console.error('Asking GitHub for the newest version failed:', error);
	}
	known.set(commit, { at: now, value });
	return value;
}
