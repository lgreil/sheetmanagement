import type { GoogleClient } from './google/client.ts';
import { contentId, getFile, isFolderLike, listChildren, SHORTCUT_MIME, type DriveFile } from './google/drive.ts';

/**
 * A snapshot of the sheet music in Drive: one entry per piece folder with its files,
 * from the archive and from the current-programme folders. File and folder names are
 * kept raw here; parsing them (title, composer, part) is a separate step, so the index
 * stays valid when the parsing rules change.
 */
export interface DriveIndex {
	version: 3;
	archiveFolderId: string;
	builtAt: string;
	/** Google API requests the crawl needed (free Workers allow 50 per invocation). */
	requestCount: number;
	pieces: IndexedPiece[];
	/** Programme names in the order of the configured folders, e.g. ["A-Orchester", "Ehemaligenorchester"]. */
	programs: string[];
	/** Files lying directly in a category folder, e.g. a running order for the Christmas pieces. */
	categoryFiles: { category: string; files: IndexedFile[] }[];
}

export interface IndexedPiece {
	folderId: string;
	name: string;
	/** Display name of the category folder it sits in, e.g. "Weihnachtsstücke". */
	category?: string;
	/** Current programmes it's in, e.g. ["Ehemaligenorchester", "A-Orchester"]. */
	programs?: string[];
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
	subfolderId?: string;
}

export const INDEX_VERSION = 3;

/** Programme folders can link to each other ("Programm A-Orchester" inside the EO's); this deep at most. */
const MAX_PROGRAM_DEPTH = 3;

export interface IndexOptions {
	archiveFolderId: string;
	/** Folders inside the archive that group pieces; the first group is the category name. */
	categoryFolderPattern: RegExp;
	/** Current-programme folders, one per orchestra or ensemble. */
	programFolderIds?: string[];
	/** Folder names that are a programme rather than a piece; the first group is its name. */
	programFolderPattern?: RegExp;
}

function toIndexedFile(file: DriveFile, subfolder?: { id: string; name: string }): IndexedFile {
	const isShortcut = file.mimeType === SHORTCUT_MIME && file.shortcutDetails;
	return {
		id: contentId(file),
		name: file.name,
		mimeType: isShortcut ? file.shortcutDetails!.targetMimeType : file.mimeType,
		modifiedTime: file.modifiedTime,
		size: file.size ? Number(file.size) : undefined,
		...(subfolder ? { subfolder: subfolder.name, subfolderId: subfolder.id } : {})
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
 * Crawls in a fixed, small number of batched requests:
 * archive → category folders, programme folders (→ linked programmes), then the files
 * of all pieces → one level of subfolders.
 */
export async function buildDriveIndex(client: GoogleClient, options: IndexOptions): Promise<DriveIndex> {
	const { archiveFolderId, categoryFolderPattern, programFolderIds = [], programFolderPattern } = options;
	const before = client.requestCount;
	const pieces = new Map<string, IndexedPiece>();
	const addPiece = (folder: DriveFile, category?: string, programs: string[] = []) => {
		const id = contentId(folder);
		const piece = pieces.get(id) ?? { folderId: id, name: folder.name, category, files: [] };
		if (programs.length) piece.programs = [...new Set([...(piece.programs ?? []), ...programs])];
		pieces.set(id, piece);
	};

	// 1. Archive top level: piece folders and category folders.
	const categories = new Map<string, string>();
	for (const entry of await listChildren(client, [archiveFolderId])) {
		if (!isFolderLike(entry)) continue;
		const category = entry.name.match(categoryFolderPattern)?.[1]?.trim();
		if (category) categories.set(contentId(entry), category);
		else addPiece(entry);
	}

	// 2. Piece folders inside category folders, and loose files there (e.g. a running order).
	const categoryFiles = new Map<string, IndexedFile[]>();
	if (categories.size > 0) {
		for (const entry of await listChildren(client, [...categories.keys()])) {
			const category = parentIn(entry, categories);
			if (!category) continue;
			if (isFolderLike(entry)) addPiece(entry, category);
			else categoryFiles.set(category, [...(categoryFiles.get(category) ?? []), toIndexedFile(entry)]);
		}
	}

	// 3. Current programmes. A folder's programme name comes from "Programm <Name>", or for a
	//    configured folder from its whole name ("01 | Aktuelles Programm" → "Aktuelles Programm").
	//    A programme folder inside another (often a shortcut) passes its pieces on: they're
	//    in both programmes.
	//    A configured folder that isn't itself a programme (the "Aktuelles Programm" parent)
	//    only names the pieces lying directly in it, not those of the programmes inside it.
	const programName = (name: string) => programFolderPattern?.exec(name)?.[1]?.trim();
	const order: string[] = [];
	/** Per folder: names for its own pieces, and names it passes on to programmes inside it. */
	let frontier = new Map<string, { own: string[]; passOn: string[] }>();
	for (const id of [...new Set(programFolderIds)]) {
		const folder = await getFile(client, id);
		const program = programName(folder.name);
		const name = program ?? folder.name.match(categoryFolderPattern)?.[1]?.trim() ?? folder.name;
		order.push(name);
		frontier.set(id, { own: [name], passOn: program ? [name] : [] });
	}
	const reached = new Map<string, Set<string>>();
	for (let depth = 0; depth < MAX_PROGRAM_DEPTH && frontier.size > 0; depth++) {
		const next = new Map<string, { own: string[]; passOn: string[] }>();
		for (const entry of await listChildren(client, [...frontier.keys()])) {
			const parent = parentIn(entry, frontier);
			if (!parent || !isFolderLike(entry)) continue;
			const nested = programName(entry.name);
			if (!nested) {
				addPiece(entry, undefined, parent.own);
				continue;
			}
			if (!order.includes(nested)) order.push(nested);
			// Visit a programme again only if it brings new names, so links in circles end.
			const id = contentId(entry);
			const known = reached.get(id) ?? new Set();
			const names = [...new Set([...(next.get(id)?.own ?? []), ...parent.passOn, nested])];
			if (names.some((name) => !known.has(name))) {
				next.set(id, { own: names, passOn: names });
				reached.set(id, new Set([...known, ...names]));
			}
		}
		frontier = next;
	}
	const used = new Set([...pieces.values()].flatMap((piece) => piece.programs ?? []));
	const programs = order.filter((name) => used.has(name));

	// 4. Files of all pieces; remember subfolders for one more level.
	const subfolders = new Map<string, { piece: IndexedPiece; id: string; name: string }>();
	if (pieces.size > 0) {
		for (const entry of await listChildren(client, [...pieces.keys()])) {
			const piece = parentIn(entry, pieces);
			if (!piece) continue;
			if (isFolderLike(entry)) subfolders.set(contentId(entry), { piece, id: contentId(entry), name: entry.name });
			else piece.files.push(toIndexedFile(entry));
		}
	}

	// 5. Files in subfolders (e.g. "Sections"). Deeper levels are ignored.
	if (subfolders.size > 0) {
		for (const entry of await listChildren(client, [...subfolders.keys()])) {
			const subfolder = parentIn(entry, subfolders);
			if (subfolder && !isFolderLike(entry)) {
				subfolder.piece.files.push(toIndexedFile(entry, subfolder));
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
		pieces: sorted,
		programs,
		categoryFiles: [...categoryFiles].map(([category, files]) => ({ category, files }))
	};
}
