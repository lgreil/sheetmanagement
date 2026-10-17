import type { GoogleClient } from './google/client.ts';
import { contentId, isFolderLike, listChildren, SHORTCUT_MIME, type DriveFile } from './google/drive.ts';

/**
 * A snapshot of the sheet-music archive: one entry per piece folder with its files.
 * File and folder names are kept raw here; parsing them (title, composer, part) is a
 * separate step, so the index stays valid when the parsing rules change.
 */
export interface DriveIndex {
	version: 1;
	archiveFolderId: string;
	builtAt: string;
	/** Google API requests the crawl needed (free Workers allow 50 per invocation). */
	requestCount: number;
	pieces: IndexedPiece[];
}

export interface IndexedPiece {
	folderId: string;
	name: string;
	/** Display name of the category folder it sits in, e.g. "Weihnachtsstücke". */
	category?: string;
	files: IndexedFile[];
}

export interface IndexedFile {
	id: string;
	name: string;
	mimeType: string;
	modifiedTime?: string;
	size?: number;
	/** Name of the subfolder inside the piece folder, if the file is not directly in it. */
	subfolder?: string;
}

export const INDEX_VERSION = 1;

function toIndexedFile(file: DriveFile, subfolder?: string): IndexedFile {
	const isShortcut = file.mimeType === SHORTCUT_MIME && file.shortcutDetails;
	return {
		id: contentId(file),
		name: file.name,
		mimeType: isShortcut ? file.shortcutDetails!.targetMimeType : file.mimeType,
		modifiedTime: file.modifiedTime,
		size: file.size ? Number(file.size) : undefined,
		...(subfolder ? { subfolder } : {})
	};
}

/** Finds which of the known folders a file belongs to. */
function parentIn<T>(file: DriveFile, folders: Map<string, T>): T | undefined {
	for (const parent of file.parents ?? []) {
		const folder = folders.get(parent);
		if (folder) return folder;
	}
	return undefined;
}

/**
 * Crawls the archive in a fixed, small number of batched requests:
 * archive → category folders → piece folders → one level of subfolders.
 */
export async function buildDriveIndex(
	client: GoogleClient,
	archiveFolderId: string,
	categoryFolderPattern: RegExp
): Promise<DriveIndex> {
	const before = client.requestCount;
	const pieces = new Map<string, IndexedPiece>();
	const addPiece = (folder: DriveFile, category?: string) => {
		const id = contentId(folder);
		if (!pieces.has(id)) pieces.set(id, { folderId: id, name: folder.name, category, files: [] });
	};

	// 1. Top level: piece folders and category folders.
	const categories = new Map<string, string>();
	for (const entry of await listChildren(client, [archiveFolderId])) {
		if (!isFolderLike(entry)) continue;
		const category = entry.name.match(categoryFolderPattern)?.[1]?.trim();
		if (category) categories.set(contentId(entry), category);
		else addPiece(entry);
	}

	// 2. Piece folders inside category folders.
	if (categories.size > 0) {
		for (const entry of await listChildren(client, [...categories.keys()])) {
			const category = parentIn(entry, categories);
			if (category && isFolderLike(entry)) addPiece(entry, category);
		}
	}

	// 3. Files of all pieces; remember subfolders for one more level.
	const subfolders = new Map<string, { piece: IndexedPiece; name: string }>();
	if (pieces.size > 0) {
		for (const entry of await listChildren(client, [...pieces.keys()])) {
			const piece = parentIn(entry, pieces);
			if (!piece) continue;
			if (isFolderLike(entry)) subfolders.set(contentId(entry), { piece, name: entry.name });
			else piece.files.push(toIndexedFile(entry));
		}
	}

	// 4. Files in subfolders (e.g. "Sections"). Deeper levels are ignored.
	if (subfolders.size > 0) {
		for (const entry of await listChildren(client, [...subfolders.keys()])) {
			const subfolder = parentIn(entry, subfolders);
			if (subfolder && !isFolderLike(entry)) {
				subfolder.piece.files.push(toIndexedFile(entry, subfolder.name));
			}
		}
	}

	const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });
	const sorted = [...pieces.values()].sort((a, b) => collator.compare(a.name, b.name));
	for (const piece of sorted) piece.files.sort((a, b) => collator.compare(a.name, b.name));

	return {
		version: INDEX_VERSION,
		archiveFolderId,
		builtAt: new Date().toISOString(),
		requestCount: client.requestCount - before,
		pieces: sorted
	};
}
