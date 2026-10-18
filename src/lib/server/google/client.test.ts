import { describe, expect, it, vi } from 'vitest';
import { GoogleApiError, GoogleClient } from './client.ts';

const tokens = () => {
	const getToken = vi.fn(async ({ forceRefresh = false } = {}) => (forceRefresh ? 'fresh' : 'old'));
	return { getToken };
};

describe('GoogleClient', () => {
	it('calls the global fetch without binding it to the client', async () => {
		// Workers throw "Illegal invocation" when fetch runs with a foreign `this`.
		const original = globalThis.fetch;
		const seenThis: unknown[] = [];
		globalThis.fetch = function (this: unknown) {
			seenThis.push(this);
			return Promise.resolve(Response.json({ ok: 1 }));
		} as typeof fetch;
		try {
			await new GoogleClient(tokens()).request('https://example.test/x');
		} finally {
			globalThis.fetch = original;
		}
		expect(seenThis[0]).not.toBeInstanceOf(GoogleClient);
	});

	it('retries once with a fresh token after a 401', async () => {
		const provider = tokens();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response(null, { status: 401 }))
			.mockResolvedValueOnce(Response.json({ ok: 1 }));
		const client = new GoogleClient(provider, fetchMock);

		await expect(client.request('https://example.test/x')).resolves.toEqual({ ok: 1 });
		expect(provider.getToken).toHaveBeenLastCalledWith({ forceRefresh: true });
		expect(fetchMock.mock.calls[1][1].headers.authorization).toBe('Bearer fresh');
		expect(client.requestCount).toBe(2);
	});

	it('throws a GoogleApiError with Google\'s message after a failed retry', async () => {
		const error = () => Response.json({ error: { message: 'File not found: abc.' } }, { status: 404 });
		const client = new GoogleClient(tokens(), vi.fn(async () => error()));
		const request = client.request('https://example.test/files/abc');
		await expect(request).rejects.toBeInstanceOf(GoogleApiError);
		await expect(request).rejects.toMatchObject({ status: 404, message: 'File not found: abc.' });
	});

	it('follows nextPageToken', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(Response.json({ items: [1, 2], nextPageToken: 'p2' }))
			.mockResolvedValueOnce(Response.json({ items: [3] }));
		const client = new GoogleClient(tokens(), fetchMock);

		const items = await client.paginate<{ items: number[]; nextPageToken?: string }, number>(
			'https://example.test/list',
			{ pageSize: 2 },
			(page) => page.items
		);
		expect(items).toEqual([1, 2, 3]);
		expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('pageToken')).toBe('p2');
	});
});
