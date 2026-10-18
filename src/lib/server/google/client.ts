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

/**
 * Thin authenticated JSON client for Google REST APIs.
 * Retries once on an expired token (401) and once on rate limits or server errors.
 */
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
		{ params, method = 'GET', body }: { params?: Params; method?: string; body?: unknown } = {}
	): Promise<T> {
		const target = new URL(url);
		for (const [name, value] of Object.entries(params ?? {})) {
			if (value !== undefined) target.searchParams.set(name, String(value));
		}

		let lastStatus = 0;
		for (let attempt = 0; ; attempt++) {
			const token = await this.tokens.getToken({ forceRefresh: lastStatus === 401 });
			this.requestCount++;
			const response = await this.fetchImpl(target, {
				method,
				headers: {
					authorization: `Bearer ${token}`,
					...(body === undefined ? {} : { 'content-type': 'application/json' })
				},
				body: body === undefined ? undefined : JSON.stringify(body)
			});
			lastStatus = response.status;

			if (response.ok) return (await response.json()) as T;

			const retryable = response.status === 401 || response.status === 429 || response.status >= 500;
			if (retryable && attempt === 0) {
				if (response.status !== 401) await new Promise((r) => setTimeout(r, 400));
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
	 * streamed on. Retries once on an expired token; other errors throw like request().
	 */
	async fetchRaw(url: string, params: Params = {}): Promise<Response> {
		const target = new URL(url);
		for (const [name, value] of Object.entries(params)) {
			if (value !== undefined) target.searchParams.set(name, String(value));
		}
		for (let attempt = 0; ; attempt++) {
			const token = await this.tokens.getToken({ forceRefresh: attempt > 0 });
			this.requestCount++;
			const response = await this.fetchImpl(target, { headers: { authorization: `Bearer ${token}` } });
			if (response.ok) return response;
			if (response.status === 401 && attempt === 0) continue;
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
