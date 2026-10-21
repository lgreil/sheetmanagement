import type { NamingRules } from '#lib/config/index.ts';

/**
 * Suggestions from the text printed on a score's first page: "Music by …", "Arranged by …",
 * "op. 24", "Gabriel FAURÉ". Many archive PDFs are scans without text, so this often finds
 * nothing; it never guesses. Only these fields leave this function, never the raw text:
 * publisher copies carry purchase notes with people's names.
 */

export interface ScoreSuggestions {
	composer?: string;
	arranger?: string;
	catalogue?: string;
}

/** Lines about a purchase or licence: they name the buyer, so they're dropped entirely. */
const PRIVATE = /purchased|copy|copies|order|licen[cs]ed|lizenz|gekauft|bestell|printed for|gedruckt für|@|www\.|https?:/i;

/** Keywords in any case, as whole words: "music", "MUSIC", but not "arr" inside "Marriage". */
const anyCase = (word: string) =>
	String.raw`\b` + [...word].map((char) => (/\p{L}/u.test(char) ? `[${char.toLowerCase()}${char.toUpperCase()}]` : char === '.' ? '\.' : char)).join('') + String.raw`\b`;
const keywords = (words: string[]) => `(?:${words.map(anyCase).join('|')})`;

/** One name: capitalised words, initials and particles, on one line ("John T. Williams", "Ludwig van Beethoven"). */
const WORD = String.raw`(?:\p{Lu}[\p{L}'’-]*\.?|van|von|der|de|da|di|du|la|le|del|y)`;
const NAME = String.raw`${WORD}(?:[ \t]+${WORD}){0,4}`;
/** Several names: "Benny Andersson, Björn Ulvaeus and Stig Anderson". */
const NAMES = String.raw`${NAME}(?:[ \t]*(?:,|&|\/|and|und)[ \t]*${NAME}){0,3}`;
const BY = String.raw`[ \t]*(?:${keywords(['by', 'von'])}|:)[ \t]*:?\s*`;

const COMPOSED = new RegExp(
	String.raw`${keywords(['words and music', 'music', 'musik', 'komponiert', 'composed', 'komposition', 'composer', 'komponist'])}${BY}(${NAMES})`,
	'u'
);
const ARRANGED = new RegExp(
	String.raw`(?:${keywords(['arranged', 'arrangement', 'bearbeitet', 'bearbeitung', 'orchestrated', 'orchestration', 'orchestriert', 'instrumentiert', 'setting'])}(?:${BY}|\s+)|${keywords(['arr', 'bearb'])}\.?\s*(?:${BY})?)(${NAMES})`,
	'u'
);

/**
 * Words printed next to names on title pages that aren't part of them: tempo and style
 * marks, instruments, "Full Score". A name ends at the first one.
 */
const STOP = new Set(
	(
		'full score scores partitur for für the orchestra orchester symphonic sinfonisch solo instrumentation conductor dirigent ' +
		'mainstream music musik pop rock jazz swing ballad ballade allegro allegretto andante adagio moderato presto largo lento ' +
		'slowly moderately brightly lively tempo grade level concert konzert edition verlag publishing publications ' +
		'violin violine viola cello flute flöte oboe clarinet klarinette horn trumpet trompete trombone posaune tuba timpani ' +
		'piano klavier percussion schlagwerk ist and und'
	).split(' ')
);
const PARTICLE = /^(van|von|der|de|da|di|du|la|le|del|y)$/;

/** Cuts a captured name at the first word that isn't one, and tidies capitals: "JOHN OTTMAN" → "John Ottman". */
function tidyName(raw: string): string {
	const names: string[] = [];
	for (const part of raw.split(/[ \t]*(?:,|&|\/|\band\b|\bund\b)[ \t]*/)) {
		const words: string[] = [];
		for (const word of part.trim().split(/[ \t]+/)) {
			const bare = word.replace(/[.,;:]+$/, '').toLowerCase();
			if (STOP.has(bare) || (!PARTICLE.test(word) && !/^\p{Lu}/u.test(word))) break;
			// A lone letter without a dot ("q", "B") is a marking, not an initial.
			if (word.length === 1) break;
			words.push(word.length > 2 && word === word.toUpperCase() ? word[0] + word.slice(1).toLowerCase() : word);
		}
		while (words.length && PARTICLE.test(words[words.length - 1])) words.pop();
		if (words.length) names.push(words.join(' '));
		else break;
	}
	return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? '');
}

function readName(match: RegExpMatchArray | null): string | undefined {
	if (!match) return undefined;
	const name = tidyName(match[1]);
	// One word only counts when it's a real surname length: "by Hal Leonard" yes, "by Q" no.
	return name.length >= 4 ? name : undefined;
}

/** "op.24" → "Op. 24", "bwv1068" → "BWV 1068", "KV 525" stays. */
export function tidyCatalogue(text: string): string {
	const match = text.trim().match(/^([A-Za-z]+\.?)\s*(.+)$/);
	if (!match) return text.trim();
	const [, prefix, rest] = match;
	const word = prefix.replace(/\.$/, '');
	// The archive's way: "Op. 24", "KV 527" (Köchel), "D. 759", "Hob. I:94", "BWV 565".
	const label = /^op$/i.test(word)
		? 'Op.'
		: /^k$/i.test(word)
			? 'KV'
			: /^(hob|h|d)$/i.test(word)
				? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}.`
				: word.toUpperCase();
	return `${label} ${rest.replace(/\s+/g, ' ')}`;
}

/**
 * Reads suggestions from the lines of a page (as a PDF viewer groups them). Known composers
 * from the naming rules count when they appear on their own, e.g. "Gabriel FAURÉ".
 */
export function readScoreText(lines: string[], naming: Pick<NamingRules, 'cataloguePatterns' | 'knownComposers'>): ScoreSuggestions {
	const kept = lines.map((line) => line.replace(/\s+/g, ' ').trim()).filter((line) => line && !PRIVATE.test(line));
	const text = kept.join('\n');
	const result: ScoreSuggestions = {};

	const arranged = text.match(ARRANGED);
	result.arranger = readName(arranged);
	// "Arranged by" mustn't count as the composer: look for the composer in the text without it.
	const withoutArranger = arranged ? text.replace(arranged[0], '') : text;
	result.composer = readName(withoutArranger.match(COMPOSED));

	if (!result.composer) {
		// A known surname on a line of its own, with the first name before it: "Gabriel FAURÉ".
		for (const line of kept) {
			const known = naming.knownComposers.find((name) => new RegExp(String.raw`(^|\s)${escape(name)}($|\s)`, 'iu').test(line));
			if (known && line.length <= 40 && !ARRANGED.test(line)) {
				// Up to two words before the surname, from the right, as long as they look like names.
				const before = line.slice(0, line.search(new RegExp(escape(known), 'iu'))).trim().split(/\s+/).slice(-2);
				const first = [];
				for (const word of before.reverse()) {
					if (STOP.has(word.toLowerCase()) || !/^\p{Lu}/u.test(word)) break;
					first.unshift(word);
				}
				result.composer = tidyName([...first, line.match(new RegExp(escape(known), 'iu'))![0]].join(' '));
				break;
			}
		}
	}

	for (const pattern of naming.cataloguePatterns) {
		const match = text.match(new RegExp(pattern.source, pattern.flags.replace('g', '')));
		if (match) {
			result.catalogue = tidyCatalogue(match[0]);
			break;
		}
	}
	return Object.fromEntries(Object.entries(result).filter(([, value]) => value)) as ScoreSuggestions;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
