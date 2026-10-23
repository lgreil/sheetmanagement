import { config } from '#lib/config/index.ts';
import { planShortcuts, programFor, type FolderEntry, type WantedPiece } from '#lib/repertoire/current-program.ts';
import { folderUrl } from './catalog.ts';
import { GoogleApiError } from './google/client.ts';
import { createFolder, createShortcut, getFile, listChildren, trashFile, FOLDER_MIME, SHORTCUT_MIME } from './google/drive.ts';
import { sameOrchestra } from '#lib/repertoire/orchestras.ts';
import { isPastConcert, programOf, type Library, type LibraryConcert } from './library.ts';
import { driveWriteEnabled, getArchiveIndex, getGoogle, programFolderIds } from './services.ts';

/**
 * "01 | Aktuelles Programm" kept in step with a concert's programme (#60): one shortcut per
 * piece in the orchestra's programme folder, made and taken out by the app instead of by hand.
 * Opt-in: it needs DRIVE_WRITE=true and DRIVE_CURRENT_PROGRAM_FOLDER_ID, and the service
 * account as editor of that folder.
 */

/** No folder to sync into: several and nothing to choose by, or none for the orchestra and nowhere to make one. */
export class NoProgramFolderError extends Error {
	constructor(readonly reason: 'ambiguous' | 'none') {
		super(reason === 'ambiguous' ? 'Several programme folders and no orchestra to choose by' : 'No programme folder for the orchestra');
		this.name = 'NoProgramFolderError';
	}
}

export function currentProgramAvailable(): boolean {
	return driveWriteEnabled() && programFolderIds().length > 0;
}

/** The orchestra's pieces that have a folder in the archive, in programme order. */
function wantedPieces(concert: LibraryConcert, library: Library, orchestra: string | undefined): WantedPiece[] {
	return programOf(concert, orchestra).flatMap((item) => {
		const piece = item.pieceId ? library.piecesById.get(item.pieceId) : undefined;
		return piece?.detail ? [{ folderId: piece.id, name: piece.detail.folderName }] : [];
	});
}

export interface CurrentProgramStatus {
	/** The programme folder's name, e.g. "Ehemaligenorchester"; none yet: it's made on the first run. */
	program?: string;
	/** Pieces of the concert that are in that programme already. */
	linked: number;
	/** Pieces of the concert with sheet music in Drive. */
	total: number;
	/** In the programme folder but not in this concert. */
	extra: string[];
}

/**
 * From the archive index, so the concert page needs no extra Drive request. One orchestra's
 * programme of the concert; a concert several orchestras play has one folder for each.
 */
export function currentProgramStatus(concert: LibraryConcert, library: Library, orchestra = concert.orchestras[0]): CurrentProgramStatus {
	const programs = library.catalog.ok ? library.catalog.catalog.programs : [];
	const program = programFor(programs, orchestra);
	const wanted = wantedPieces(concert, library, orchestra);
	const ids = new Set(wanted.map((piece) => piece.folderId));
	const inProgram = program ? library.pieces.filter((piece) => piece.programs.includes(program)) : [];
	return {
		program,
		linked: wanted.filter((piece) => inProgram.some((other) => other.id === piece.folderId)).length,
		total: wanted.length,
		extra: inProgram.filter((piece) => !ids.has(piece.id)).map((piece) => piece.title)
	};
}

/** Whether the concert's programme is the one to keep in the orchestra's folder: its next concert. */
export function isCurrentConcert(concert: LibraryConcert, library: Library, orchestra = concert.orchestras[0]): boolean {
	if (isPastConcert(concert, library.today)) return false;
	const plays = (other: LibraryConcert) =>
		orchestra ? other.orchestras.some((name) => sameOrchestra(name, orchestra)) : !other.orchestras.length;
	const next = library.concerts
		.filter((other) => plays(other) && !isPastConcert(other, library.today) && other.dateKey)
		.sort((a, b) => a.dateKey.localeCompare(b.dateKey))[0];
	return !next || next.id === concert.id;
}

export interface CurrentProgramResult {
	/** Whose programme was synced. */
	orchestra?: string;
	folderName: string;
	folderUrl: string;
	added: string[];
	removed: string[];
	/** To be taken out, but the service account may not: someone else's shortcut. */
	stuck: string[];
}

/** Makes the orchestra's folder match its programme: shortcuts in, shortcuts to other pieces out (into the bin). */
export async function syncCurrentProgram(concert: LibraryConcert, library: Library, orchestra = concert.orchestras[0]): Promise<CurrentProgramResult> {
	const { client } = getGoogle();
	const roots = programFolderIds();
	const pattern = config.naming.programFolderPattern;

	// Read like the archive index does: a configured folder named "Programm …" is a programme
	// itself, any other (like "01 | Aktuelles Programm") holds the "Programm …" folders.
	const named = (name: string) => pattern.exec(name)?.[1]?.trim();
	const configured = await Promise.all(roots.map((id) => getFile(client, id)));
	const containers = configured.filter((folder) => !named(folder.name));
	const inside = containers.length ? await listChildren(client, containers.map((folder) => folder.id)) : [];
	const folders = [...configured, ...inside.filter((entry) => entry.mimeType === FOLDER_MIME)].flatMap((entry) => {
		const name = named(entry.name);
		return name ? [{ id: entry.id, folderName: entry.name, name }] : [];
	});

	let target = folders.find((folder) => folder.name === programFor(folders.map((other) => other.name), orchestra));
	if (!target && !folders.length && containers.length) {
		// No programme folders at all: the current-programme folder itself is the one programme.
		target = { id: containers[0].id, folderName: containers[0].name, name: containers[0].name };
	} else if (!target && !orchestra) {
		// Several programmes and no orchestra to choose by: better nothing than the wrong one.
		throw new NoProgramFolderError('ambiguous');
	} else if (!target) {
		// The orchestra's own folder, next to the others; never inside another orchestra's.
		if (!containers.length) throw new NoProgramFolderError('none');
		const folderName = `Programm ${orchestra}`;
		const made = await createFolder(client, folderName, containers[0].id);
		target = { id: made.id, folderName, name: orchestra ?? '' };
	}

	const entries = (await listChildren(client, [target.id])).map((entry) => ({
		id: entry.id,
		name: entry.name,
		targetId: entry.mimeType === SHORTCUT_MIME ? entry.shortcutDetails?.targetId : undefined,
		program: named(entry.name) !== undefined
	}));
	const plan = planShortcuts(entries, wantedPieces(concert, library, orchestra));
	for (const piece of plan.create) await createShortcut(client, piece.name, piece.folderId, target.id);
	// In "My Drive" only a file's owner may bin it: a shortcut made by hand stays, and is named.
	const stuck = new Set<FolderEntry>();
	for (const entry of plan.trash) {
		await trashFile(client, entry.id).catch((cause) => {
			if (!(cause instanceof GoogleApiError && cause.status === 403)) throw cause;
			stuck.add(entry);
		});
	}
	// The archive index knows the programmes; read it again so pages show the new state.
	await getArchiveIndex({ force: true }).catch((cause) => console.error('Refreshing the archive failed:', cause));
	return {
		orchestra,
		folderName: target.folderName,
		folderUrl: folderUrl(target.id),
		added: plan.create.map((piece) => piece.name),
		removed: plan.trash.filter((entry) => !stuck.has(entry)).map((entry) => entry.name),
		stuck: [...stuck].map((entry) => entry.name)
	};
}
