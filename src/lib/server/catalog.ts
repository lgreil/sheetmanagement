import { config, type Instrument } from '#lib/config/index.ts';
import { buildCatalog, type Catalog } from '#lib/music/catalog.ts';
import type { DriveIndex } from './drive-index.ts';
import { isDemo } from './env.ts';
import { getArchiveIndex, NotConfiguredError } from './services.ts';

// Parsing ~2000 file names takes 15-40 ms of CPU, so it happens once per archive
// snapshot and Worker instance, not on every request.
// Built again when a deployment's own instrument labels or spellings change (#143).
const built = new WeakMap<DriveIndex, { instruments: readonly Instrument[]; catalog: Catalog }>();

export type CatalogResult =
	| { ok: true; catalog: Catalog; storedAt: number }
	| { ok: false; reason: 'not-configured' | 'failed' };

export async function getCatalog(): Promise<CatalogResult> {
	try {
		const { value: index, storedAt } = await getArchiveIndex();
		const cached = built.get(index);
		let catalog = cached?.instruments === config.instruments ? cached.catalog : undefined;
		if (!catalog) {
			catalog = buildCatalog(index, config);
			built.set(index, { instruments: config.instruments, catalog });
		}
		return { ok: true, catalog, storedAt };
	} catch (error) {
		if (error instanceof NotConfiguredError) return { ok: false, reason: 'not-configured' };
		console.error('Loading the archive failed:', error);
		return { ok: false, reason: 'failed' };
	}
}

const GOOGLE_DOC = 'application/vnd.google-apps.document';
const GOOGLE_SHEET = 'application/vnd.google-apps.spreadsheet';

/** Where `fileUrl` can point, for `redirect`'s allowlist of external origins. */
export const FILE_ORIGINS = ['https://docs.google.com', 'https://drive.google.com'];

/** Opens a file in Google's own viewer, so the visitor's Drive access applies. */
export function fileUrl(id: string, mimeType: string): string {
	// The demo's files exist only in the app, so its PDFs come through the app too.
	if (isDemo() && mimeType === 'application/pdf') return `/api/noten/${encodeURIComponent(id)}`;
	if (mimeType === GOOGLE_DOC) return `https://docs.google.com/document/d/${id}/edit`;
	if (mimeType === GOOGLE_SHEET) return `https://docs.google.com/spreadsheets/d/${id}/edit`;
	return `https://drive.google.com/file/d/${id}/view`;
}

/**
 * Where a part opens: Drive's viewer, which needs a Google account with access to the
 * folder. Members signed in with an access link may have none, so their PDFs come
 * through the app (/api/noten), which checks they're a member.
 */
export function partUrl(id: string, mimeType: string, viaLink: boolean | undefined): string {
	return viaLink && mimeType === 'application/pdf' ? `/api/noten/${encodeURIComponent(id)}` : fileUrl(id, mimeType);
}

export function folderUrl(id: string): string {
	return `https://drive.google.com/drive/folders/${id}`;
}
