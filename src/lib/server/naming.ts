import { config } from '#lib/config/index.ts';
import { checkSection, guessShortTitle, type NameCheck, type NamingFile } from '#lib/music/naming.ts';
import { createInstrumentMatcher } from '#lib/music/part-name.ts';
import type { Library } from './library.ts';

/** One folder (or subfolder) of the archive as the naming check sees it. */
export interface NamingSection {
	/** "<piece id>:<section key>", stable across reloads. */
	key: string;
	pieceId: string;
	folderName: string;
	/** "2. Satz" for a subfolder, empty for the files directly in the piece folder. */
	section: string;
	files: NamingFile[];
	/** The guessed short title the suggestions start from; people may change it. */
	shortTitle: string;
	movement?: number;
	titles: string[];
}

export const matcher = createInstrumentMatcher(config.instruments);

/** Every section of the archive with its files, in archive order. */
export function namingSections(library: Library): NamingSection[] {
	return library.pieces.flatMap((piece) => {
		const detail = piece.detail;
		if (!detail) return [];
		return detail.sections.map((section): NamingSection => {
			const files = detail.parts
				.filter((part) => part.section === section.key)
				.map(({ id, fileName, mimeType }) => ({ id, name: fileName, mimeType }));
			return {
				key: `${detail.id}:${section.key}`,
				pieceId: detail.id,
				folderName: detail.folderName,
				section: section.label,
				files,
				shortTitle: guessShortTitle(files, detail.title, config.naming, detail),
				movement: Number(/^(\d+)\. Satz/.exec(section.label)?.[1]) || undefined,
				titles: [detail.folderName, detail.title]
			};
		});
	});
}

export function checkNamingSection(section: NamingSection, shortTitle = section.shortTitle): NameCheck[] {
	return checkSection(section.files, shortTitle, config.naming, matcher, { movement: section.movement, titles: section.titles });
}
