import type { TokenProvider } from './auth.ts';

export class GoogleApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly url: string
	) {
		super(message);
		this.name = 'GoogleApiError';
	}
}

type Params = Record<string, string | number | boolean | undefined>;

/** Google normally answers within a second or two; a request hanging longer fails instead of holding up the page. */
const REQUEST_TIMEOUT_MS = 12_000;

/** Tries per request, the first included: enough to ride out a short hiccup, not enough to hold up a page for long. */
export const MAX_ATTEMPTS = 3;

/** Longest wait before the next try, also when Google asks for more with Retry-After. */
const MAX_WAIT_MS = 4_000;

/** Statuses worth another try (#191): rate limits and Google's own trouble. */
export const retryable = (status: number) => status === 429 || status >= 500;

/** How long to wait before try `attempt` + 1: Google's Retry-After if it says, else 400 ms, then 1.2 s … */
export function backoff(attempt: number, retryAfter: string | null = null): number {
	const asked = retryAfter && /^\d+$/.test(retryAfter.trim()) ? Number(retryAfter) * 1000 : NaN;
	return Math.min(MAX_WAIT_MS, Number.isFinite(asked) ? asked : 400 * 3 ** attempt);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A request that never got an answer: the network or the timeout. Only reads are tried again,
 * since a write may have landed before the answer was lost.
 */
const lostOnTheWay = (error: unknown) => error instanceof TypeError || (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError'));

export class GoogleClient {
	/** Number of HTTP requests made, to keep an eye on the Workers subrequest limit. */
	requestCount = 0;

	constructor(
		private readonly tokens: TokenProvider,
		// Wrapped so fetch is never called as a method of this class: the Workers
		// runtime rejects that with "Illegal invocation".
		private readonly fetchImpl: typeof fetch = (input, init) => fetch(input, init)
	) {}

	async request<T>(
		url: string,
		options: { params?: Params; method?: string; body?: unknown; headers?: Record<string, string> } = {}
	): Promise<T> {
		return (await (await this.send(url, options)).json()) as T;
	}

	/** Like request(), but the response itself, for answers that matter by their headers. */
	async send(
		url: string,
		{ params, method = 'GET', body, headers = {} }: { params?: Params; method?: string; body?: unknown; headers?: Record<string, string> } = {}
	): Promise<Response> {
		const target = new URL(url);
		for (const [name, value] of Object.entries(params ?? {})) {
			if (value !== undefined) target.searchParams.set(name, String(value));
		}

		let lastStatus = 0;
		let refreshed = false;
		for (let attempt = 0; ; attempt++) {
			const token = await this.tokens.getToken({ forceRefresh: lastStatus === 401 });
			this.requestCount++;
			let response: Response;
			try {
				response = await this.fetchImpl(target, {
					method,
					headers: {
						authorization: `Bearer ${token}`,
						...(body === undefined ? {} : { 'content-type': body instanceof Blob ? body.type : 'application/json' }),
						...headers
					},
					// A Blob goes as is (an upload's content), anything else as JSON.
					body: body === undefined ? undefined : body instanceof Blob ? body : JSON.stringify(body),
					signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
				});
			} catch (error) {
				if (method === 'GET' && lostOnTheWay(error) && attempt + 1 < MAX_ATTEMPTS) {
					lastStatus = 0;
					await wait(backoff(attempt));
					continue;
				}
				throw error;
			}
			lastStatus = response.status;

			if (response.ok) return response;

			if (response.status === 401 && !refreshed) {
				refreshed = true;
				continue;
			}
			if (retryable(response.status) && attempt + 1 < MAX_ATTEMPTS) {
				await wait(backoff(attempt, response.headers.get('retry-after')));
				continue;
			}

			const detail = (await response.json().catch(() => null)) as {
				error?: { message?: string };
			} | null;
			throw new GoogleApiError(
				response.status,
				detail?.error?.message ?? response.statusText ?? 'Request failed',
				target.origin + target.pathname
			);
		}
	}

	/**
	 * A GET whose body isn't JSON, e.g. a file's content, as the raw response so it can be
	 * streamed on. Retries like request(), except after a lost answer; other errors throw like it.
	 */
	async fetchRaw(url: string, params: Params = {}): Promise<Response> {
		const target = new URL(url);
		for (const [name, value] of Object.entries(params)) {
			if (value !== undefined) target.searchParams.set(name, String(value));
		}
		let refresh = false;
		for (let attempt = 0; ; attempt++) {
			const token = await this.tokens.getToken({ forceRefresh: refresh });
			this.requestCount++;
			// No timeout here: the body is streamed on after this returns, and a large PDF may take a while.
			const response = await this.fetchImpl(target, { headers: { authorization: `Bearer ${token}` } });
			if (response.ok) return response;
			if (response.status === 401 && !refresh) {
				refresh = true;
				continue;
			}
			if (retryable(response.status) && attempt + 1 < MAX_ATTEMPTS) {
				await wait(backoff(attempt, response.headers.get('retry-after')));
				continue;
			}
			const detail = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
			throw new GoogleApiError(
				response.status,
				detail?.error?.message ?? (response.statusText || 'Request failed'),
				target.origin + target.pathname
			);
		}
	}

	/** Follows `nextPageToken` until all pages are read. */
	async paginate<TPage extends { nextPageToken?: string }, TItem>(
		url: string,
		params: Params,
		items: (page: TPage) => TItem[] | undefined
	): Promise<TItem[]> {
		const all: TItem[] = [];
		let pageToken: string | undefined;
		do {
			const page = await this.request<TPage>(url, { params: { ...params, pageToken } });
			all.push(...(items(page) ?? []));
			pageToken = page.nextPageToken;
		} while (pageToken);
		return all;
	}
}
