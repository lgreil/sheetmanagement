import { describe, expect, it } from 'vitest';
import { GoogleClient } from './client.ts';
import { createComment, queryString, renameFile, replyToComment } from './drive.ts';

describe('queryString', () => {
	it('quotes a plain folder id as is', () => {
		expect(queryString('1G98XaafBHbqCSxDaCzdX7yCYsgnZd9IY')).toBe("'1G98XaafBHbqCSxDaCzdX7yCYsgnZd9IY'");
	});

	it('escapes quotes and backslashes, backslashes first', () => {
		expect(queryString("it's")).toBe("'it\\'s'");
		// A trailing backslash must not escape the closing quote.
		expect(queryString('a\\')).toBe("'a\\\\'");
		expect(queryString("\\'")).toBe("'\\\\\\''");
	});
});

describe('writing to Drive', () => {
	const recorder = () => {
		const calls: { method: string; url: URL; body: unknown }[] = [];
		const client = new GoogleClient({ getToken: async () => 'token' }, (async (input: URL, init: RequestInit) => {
			calls.push({ method: init.method ?? 'GET', url: new URL(input), body: init.body ? JSON.parse(String(init.body)) : undefined });
			return Response.json({ id: 'new-id', name: 'renamed' });
		}) as typeof fetch);
		return { client, calls };
	};

	it('comments on a file and resolves the comment', async () => {
		const { client, calls } = recorder();
		expect(await createComment(client, 'file 1', 'Seite 3 fehlt')).toBe('new-id');
		await replyToComment(client, 'file 1', 'c/1', 'resolve', 'Erledigt.');
		expect(calls.map((c) => [c.method, c.url.pathname, c.body])).toEqual([
			['POST', '/drive/v3/files/file%201/comments', { content: 'Seite 3 fehlt' }],
			['POST', '/drive/v3/files/file%201/comments/c%2F1/replies', { action: 'resolve', content: 'Erledigt.' }]
		]);
		// Drive's comment API insists on "fields".
		expect(calls.every((c) => c.url.searchParams.get('fields') === 'id')).toBe(true);
	});

	it('renames a file, also in shared drives', async () => {
		const { client, calls } = recorder();
		await renameFile(client, 'f1', 'Elegie - Viola - LEER.pdf');
		expect(calls[0]).toMatchObject({ method: 'PATCH', body: { name: 'Elegie - Viola - LEER.pdf' } });
		expect(calls[0].url.searchParams.get('supportsAllDrives')).toBe('true');
	});
});
