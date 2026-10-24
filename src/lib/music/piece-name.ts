import { searchText } from './text.ts';
import type { NamingRules } from '#lib/config/index.ts';

export interface PieceName {
	title: string;
	composer?: string;
	catalogue?: string;
}

function catalogueAtStart(text: string, patterns: RegExp[]): string | undefined {
	for (const pattern of patterns) {
		const match = pattern.exec(text);
		if (match && match.index === 0) return match[0];
	}
	return undefined;
}

const startsWithWord = (text: string, word: string) =>
	text.toLowerCase().startsWith(word.toLowerCase()) && /^($|[\s-])/.test(text.slice(word.length));

/**
 * Reads a piece folder name such as
 * "Bach BWV 147 - Jesu bleibet meine Freude", "Bizet - Carmen", "Superman Returns"
 * or the older reversed form "Waltz Nr. 2 - Schostakowitsch".
 */
export function parsePieceName(folderName: string, naming: NamingRules): PieceName {
	const name = folderName.trim();
	const { cataloguePatterns, knownComposers, separator } = naming;
	const composers = [...knownComposers].sort((a, b) => b.length - a.length);
	const stripSeparator = (text: string) => text.trim().replace(/^-\s*/, '').trim();

	// "<Komponist> [<Verzeichnis>] - <Titel>" with a known composer.
	const known = composers.find((composer) => startsWithWord(name, composer));
	if (known) {
		let rest = name.slice(known.length).trim();
		const catalogue = catalogueAtStart(rest, cataloguePatterns);
		if (catalogue) rest = rest.slice(catalogue.length);
		return { composer: known, catalogue, title: stripSeparator(rest) || name };
	}

	// "<Verzeichnis> - <Titel>" without a composer, e.g. "BWV 1068 - Air".
	const leadingCatalogue = catalogueAtStart(name, cataloguePatterns);
	if (leadingCatalogue) {
		return { catalogue: leadingCatalogue, title: stripSeparator(name.slice(leadingCatalogue.length)) || name };
	}

	// "<Unbekannter Komponist> <Verzeichnis> - <Titel>", e.g. "Gliere Op. 70 - Russian Sailors Dance".
	const separatorAt = name.indexOf(separator);
	if (separatorAt > 0) {
		const left = name.slice(0, separatorAt);
		for (const pattern of cataloguePatterns) {
			const match = pattern.exec(left);
			if (match && match.index > 0 && match.index + match[0].length === left.trimEnd().length) {
				return {
					composer: left.slice(0, match.index).trim(),
					catalogue: match[0],
					title: name.slice(separatorAt + separator.length).trim()
				};
			}
		}
	}

	// Older reversed form: "<Titel> - <Komponist>".
	const lastSeparator = name.lastIndexOf(separator);
	if (lastSeparator > 0) {
		const right = name.slice(lastSeparator + separator.length).trim();
		const composer = composers.find((c) => c.toLowerCase() === right.toLowerCase());
		if (composer) return { composer, title: name.slice(0, lastSeparator).trim() };
	}

	return { title: name };
}

/**
 * Which numbered work a title names, so separate folders of one work can be shown
 * together: "Sinfonie Nr. 4 Italienische" and "Sinfonie Nr4 Satz 2 - Streicherbesetzung"
 * both give "sinfonie 4". Undefined for titles without "Nr.".
 */
export function workKey(title: string): string | undefined {
	const match = searchText(title).match(/^(.*?)\bnr\.?\s*(\d+)/);
	if (!match) return undefined;
	const kind = match[1].replace(/[^a-z]+/g, ' ').trim();
	return kind ? `${kind} ${match[2]}` : undefined;
}

/**
 * The folder name "93 | Namenskonvention" gives a new piece (#193), the reverse of
 * parsePieceName: "<Komponist> <Verzeichnis> - <Titel>" for classical works (a catalogue
 * number, or a composer the convention knows), "<Verzeichnis> - <Titel>" without a
 * composer, else just the title. The composer is their last name, as on the existing folders.
 */
export function pieceFolderName(piece: PieceName, naming: NamingRules): string {
	const clean = (text: string | undefined) => (text ?? '').replace(/[\\/]/g, ' ').replace(/\s+/g, ' ').trim();
	const title = clean(piece.title);
	const catalogue = clean(piece.catalogue);
	const first = clean(piece.composer?.split(/[,;]/)[0]);
	// "Johann Sebastian Bach" → "Bach", "Andrew Lloyd Webber" stays: the name the convention knows, else the last word.
	const endsWith = (known: string) => first.toLowerCase() === known.toLowerCase() || first.toLowerCase().endsWith(` ${known.toLowerCase()}`);
	const knownName = naming.knownComposers.find(endsWith);
	const composer = knownName ?? first.split(' ').pop() ?? '';
	const head = catalogue ? [composer, catalogue].filter(Boolean).join(' ') : (knownName ?? '');
	return head ? `${head}${naming.separator}${title}` : title;
}
