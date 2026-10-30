import { describe, expect, it, vi } from 'vitest';
import { isRedirect, redirect } from '@sveltejs/kit';
import { FILE_ORIGINS, fileUrl, partUrl } from './catalog.ts';

vi.mock('./env.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('./env.ts')>()),
	isDemo: () => false
}));

describe('file links', () => {
	// SvelteKit 3 refuses external redirects unless allowed; that once broke /ueben/[id] with a 500.
	it.each(['application/pdf', 'application/vnd.google-apps.document', 'application/vnd.google-apps.spreadsheet'])(
		'redirects to a %s file with the allowed origins',
		(mimeType) => {
			let thrown: unknown;
			try {
				redirect(303, fileUrl('abc', mimeType), { external: FILE_ORIGINS });
			} catch (error) {
				thrown = error;
			}
			expect(isRedirect(thrown)).toBe(true);
		}
	);

	it('keeps a PDF opened via link in the app', () => {
		expect(partUrl('abc', 'application/pdf', true)).toBe('/api/noten/abc');
	});
});
