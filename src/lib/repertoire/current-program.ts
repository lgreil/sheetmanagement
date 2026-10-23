/**
 * "01 | Aktuelles Programm" filled from a concert's programme (#60): which programme folder
 * belongs to the concert, and which shortcuts to add and to take out so the folder holds
 * exactly the programme's pieces. Only the planning; the Drive calls are in the server module.
 */

const fold = (text: string) =>
	text
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.trim();

/**
 * The letters people abbreviate an orchestra with: "Ehemaligenorchester" → "EO",
 * "A-Orchester" → "AO", "Junges Orchester" → "JO".
 */
export function orchestraInitials(name: string): string {
	return fold(name)
		.split(/[\s-]+/)
		.filter(Boolean)
		.map((word) => (word.length > 9 && word.endsWith('orchester') ? `${word[0]}o` : word[0]))
		.join('')
		.toUpperCase();
}

/** Whether a programme ("Ehemaligenorchester", "A-Orchester") is the orchestra's ("EO", "A"). */
export function isOrchestrasProgram(program: string, orchestra: string): boolean {
	const p = fold(program);
	const o = fold(orchestra);
	if (!o) return false;
	return p === o || p.startsWith(`${o}-`) || p.startsWith(`${o} `) || orchestraInitials(program) === orchestra.trim().toUpperCase();
}

/**
 * The concert's programme among the existing ones. A concert of an orchestra gets only that
 * orchestra's, never another's; one without an orchestra gets the programme if there is only one.
 */
export function programFor(programs: string[], orchestra: string | undefined): string | undefined {
	if (orchestra) return programs.find((program) => isOrchestrasProgram(program, orchestra));
	return programs.length === 1 ? programs[0] : undefined;
}

export interface FolderEntry {
	id: string;
	name: string;
	/** For a shortcut: what it points to. Other entries are never touched. */
	targetId?: string;
	/** A programme inside this one ("Programm A-Orchester"): its pieces are in both, so it stays. */
	program?: boolean;
}

export interface WantedPiece {
	/** The piece's folder in the archive. */
	folderId: string;
	name: string;
}

export interface ShortcutPlan {
	create: WantedPiece[];
	/** Shortcuts to pieces that aren't in the programme (any more). */
	trash: FolderEntry[];
	keep: number;
}

/** What to change so the folder links exactly the wanted pieces, each once. */
export function planShortcuts(entries: FolderEntry[], wanted: WantedPiece[]): ShortcutPlan {
	const wantedIds = new Set(wanted.map((piece) => piece.folderId));
	const linked = new Set<string>();
	const trash: FolderEntry[] = [];
	for (const entry of entries) {
		if (!entry.targetId || entry.program) continue;
		// A second shortcut to the same piece goes too.
		if (!wantedIds.has(entry.targetId) || linked.has(entry.targetId)) trash.push(entry);
		else linked.add(entry.targetId);
	}
	const seen = new Set<string>();
	const create = wanted.filter((piece) => !linked.has(piece.folderId) && !seen.has(piece.folderId) && seen.add(piece.folderId));
	return { create, trash, keep: linked.size };
}
