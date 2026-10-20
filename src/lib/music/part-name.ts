import type { Instrument, InstrumentFamily, NamingRules } from '#lib/config/index.ts';
import { formatNumbers, isOrdinal, parseNumeral, tokenize } from './text.ts';
import type { PartKind, PartStatus } from './types.ts';

interface AliasEntry {
	tokens: string[];
	instrument: Instrument;
	index: number;
}

/** Instrument names and aliases as token lists, longest first, so "bass clarinet" wins over "bass". */
export interface InstrumentMatcher {
	aliases: AliasEntry[];
	order: Map<Instrument, number>;
}

export function createInstrumentMatcher(instruments: Instrument[]): InstrumentMatcher {
	const aliases: AliasEntry[] = [];
	instruments.forEach((instrument, index) => {
		for (const label of [instrument.name, ...(instrument.aliases ?? [])]) {
			aliases.push({ tokens: tokenize(label), instrument, index });
		}
	});
	aliases.sort((a, b) => b.tokens.length - a.tokens.length);
	return { aliases, order: new Map(instruments.map((instrument, index) => [instrument, index])) };
}

function matchAt(tokens: string[], start: number, matcher: InstrumentMatcher): AliasEntry | undefined {
	return matcher.aliases.find((alias) => alias.tokens.every((token, i) => tokens[start + i] === token));
}

interface Item {
	instrument: Instrument;
	numbers: number[];
	transposition?: string;
	/** "/" means alternative instruments, otherwise they are combined ("&"). */
	joiner: string;
}

export interface ParsedPart {
	label: string;
	kind: PartKind;
	family?: InstrumentFamily;
	instruments: string[];
	/** Each instrument with its part numbers: "Geige I & II" → [{ instrument: "Geige", numbers: [1, 2] }]. */
	voices: Voice[];
	notes: string[];
	status: PartStatus;
	featured: boolean;
	/** Sort position: instrument order, then part number. */
	order: number;
}

export interface Voice {
	instrument: string;
	/** Empty when the file has no number, i.e. it's for every player of the instrument. */
	numbers: number[];
}

const JOINERS = new Set(['+', '&', '/', ',', 'und', 'and', '–']);

/**
 * Reads a part file name in the orchestra's convention ("BWV 147 - Geige II - LEER.pdf")
 * or in older styles ("Best_of_Bach-ViolinII.pdf", "1. Violine.pdf", "Horn in F 2.pdf").
 *
 * @param prefix Text shared by all files of the piece (see `sharedPrefix`), removed first.
 */
export function parsePartName(
	fileName: string,
	mimeType: string,
	naming: NamingRules,
	matcher: InstrumentMatcher,
	prefix = ''
): ParsedPart {
	let name = fileName
		.trim()
		.replace(/\.[a-z0-9]{2,4}$/i, '')
		// The extension typed into the name as well: "Pianopdf.pdf"
		.replace(/(?<=[a-z])pdf$/i, '')
		// A copy's suffix from Drive or the desktop: "Horn- (1).pdf"
		.replace(/\s+\(\d+\)$/, '');
	const featured = name.startsWith(naming.featuredPrefix);
	if (featured) name = name.slice(naming.featuredPrefix.length).trim();
	if (prefix && name.startsWith(prefix)) name = name.slice(prefix.length);

	const notes: string[] = [];
	// Movement numbers glued to the front: "Dvorak_9-4_Viola" → after the prefix "4_Viola".
	const movement = /^(\d{1,2})[_-](?=\D)/.exec(name);
	if (movement) {
		notes.push(`${naming.movementNote ?? 'Satz'} ${Number(movement[1])}`);
		name = name.slice(movement[0].length);
	}

	const tokens = tokenize(name);
	const statusWords: Record<string, PartStatus> = {
		...naming.statusAliases,
		[naming.status.missing.toLowerCase()]: 'missing',
		[naming.status.empty.toLowerCase()]: 'empty',
		[naming.status.incomplete.toLowerCase()]: 'incomplete'
	};
	const transpositionKeys = Object.keys(naming.transpositions)
		.map((key) => key.split(' '))
		.sort((a, b) => b.length - a.length);

	// Notes can span several words ("Bass-Fassung"), so they are matched like instruments.
	const noteKeys = Object.keys(naming.partNotes)
		.map((key) => ({ tokens: tokenize(key), text: naming.partNotes[key] }))
		.sort((a, b) => b.tokens.length - a.tokens.length);
	const noteAt = (at: number) => noteKeys.find((note) => note.tokens.every((t, k) => tokens[at + k] === t));

	const voice = matcher.aliases.find((alias) => alias.instrument.voice)?.instrument;
	const items: Item[] = [];
	const unknown: string[] = [];
	let status: PartStatus = 'ok';
	let pendingNumbers: number[] = [];
	/** A key written before the instrument: "F Horn", "B-flat Clarinet". */
	let pendingTransposition: string | undefined;
	let joiner = '&';
	let afterUnknownWord = false;

	const readTransposition = (at: number, requireIn: boolean, allowAmbiguous = false): [string | undefined, number] => {
		const hasIn = tokens[at] === 'in';
		if (requireIn && !hasIn) return [undefined, at];
		const from = hasIn ? at + 1 : at;
		for (const key of transpositionKeys) {
			// Without "in", only unambiguous keys count ("Bb", "Es", "F"), not "a" or "c".
			if (!hasIn && !allowAmbiguous && key.length === 1 && ['a', 'c', 'd'].includes(key[0])) continue;
			if (key.every((token, i) => tokens[from + i] === token)) {
				return [naming.transpositions[key.join(' ')], from + key.length];
			}
		}
		return [undefined, at];
	};

	/** An unambiguous key directly followed by an instrument: [key, index of the instrument]. */
	const keyBeforeInstrument = (at: number): [string, number] | undefined => {
		const [transposition, after] = readTransposition(at, false);
		return transposition && matchAt(tokens, after, matcher) ? [transposition, after] : undefined;
	};

	/** Part numbers before the instrument, maybe with a key: "1. Violine", "1. und 2. F Horn", "2nd B-flat Trumpet". */
	const numbersBeforeInstrument = (at: number): { numbers: number[]; transposition?: string; after: number } | undefined => {
		const numbers: number[] = [];
		let k = at;
		while (parseNumeral(tokens[k]) !== undefined) {
			numbers.push(parseNumeral(tokens[k])!);
			k++;
			if (['+', '&', ',', 'und'].includes(tokens[k]) && parseNumeral(tokens[k + 1]) !== undefined) k++;
			else break;
		}
		if (!numbers.length) return undefined;
		if (matchAt(tokens, k, matcher)) return { numbers, after: k };
		const key = keyBeforeInstrument(k);
		return key ? { numbers, transposition: key[0], after: key[1] } : undefined;
	};

	let i = 0;
	while (i < tokens.length) {
		const token = tokens[i];
		const note = noteAt(i);
		if (note) {
			if (!notes.includes(note.text)) notes.push(note.text);
			i += note.tokens.length;
			afterUnknownWord = false;
			continue;
		}
		const match = matchAt(tokens, i, matcher);

		if (match) {
			afterUnknownWord = false;
			const item: Item = {
				instrument: match.instrument,
				numbers: pendingNumbers,
				transposition: pendingTransposition,
				joiner
			};
			pendingNumbers = [];
			pendingTransposition = undefined;
			joiner = '&';
			i += match.tokens.length;

			// Numbers and transposition may come in either order: "Horn in F 2", "Saxophon Eb 1+2".
			for (let round = 0; round < 2; round++) {
				// Clef markings for baritone parts: "B.C." (bass clef), "T.C." (treble clef).
				if ((tokens[i] === 'b' || tokens[i] === 't') && tokens[i + 1] === 'c') {
					notes.push(`${tokens[i].toUpperCase()}.C.`);
					i += 2;
				}
				let joined = false;
				while (parseNumeral(tokens[i]) !== undefined) {
					// "1. Trompete-1. Klarinette": the second "1" belongs to the next instrument,
					// but in "Part 4 + 5 Cello" the "5" still belongs to the voice.
					if (item.numbers.length > 0 && !joined && matchAt(tokens, i + 1, matcher)) break;
					item.numbers.push(parseNumeral(tokens[i])!);
					i++;
					joined = false;
					const next = parseNumeral(tokens[i + 1]);
					if (tokens[i] === '–' && next !== undefined) {
						for (let n = item.numbers[item.numbers.length - 1] + 1; n <= next; n++) item.numbers.push(n);
						i += 2;
					} else if (['+', '&', ',', 'und'].includes(tokens[i]) && next !== undefined) {
						i++;
						joined = true;
					}
				}
				// Singers aren't transposed: "Gesang B" means the bass voice, kept as a note below.
				if (!item.transposition && item.instrument.family !== 'gesang') {
					const [transposition, after] = readTransposition(i, false);
					if (transposition) {
						item.transposition = transposition;
						i = after;
					}
				}
			}
			items.push(item);
			continue;
		}

		// "Section II Violine": II belongs to "Section". An ordinal ("1st") never does.
		const wasAfterUnknownWord = afterUnknownWord && !isOrdinal(token);
		afterUnknownWord = false;
		const leading = numbersBeforeInstrument(i);
		if (statusWords[token]) {
			status = statusWords[token];
		} else if (leading && (!wasAfterUnknownWord || leading.numbers.length > 1)) {
			// "1. Violine", "2.Flöte" (but not "Section II Violine", where II belongs to "Section";
			// a list like "Dance 1. und 2. F Horn" is clear even after a word)
			({ numbers: pendingNumbers, transposition: pendingTransposition, after: i } = leading);
			continue;
		} else if (parseNumeral(token) !== undefined && voice && readTransposition(i + 1, false, true)[0]) {
			// Flexible voices written as "3Es", "1C": voice 3 in Es.
			const [transposition, after] = readTransposition(i + 1, false, true);
			items.push({ instrument: voice, numbers: [parseNumeral(token)!], transposition, joiner });
			i = after;
			continue;
		} else if (JOINERS.has(token)) {
			if (token === '/') joiner = '/';
		} else if (token === 'in' && items.length > 0) {
			const [transposition, after] = readTransposition(i, true);
			if (transposition && !items[items.length - 1].transposition) {
				items[items.length - 1].transposition = transposition;
				i = after;
				continue;
			}
		} else if (keyBeforeInstrument(i)) {
			const [transposition, after] = keyBeforeInstrument(i)!;
			pendingTransposition = transposition;
			i = after;
			continue;
		} else {
			unknown.push(token);
			afterUnknownWord = true;
		}
		i++;
	}

	// "Horn I & Horn II" → "Horn I & II"; "Kontrabass / Stringbass" → "Kontrabass".
	for (let k = items.length - 1; k > 0; k--) {
		const [previous, current] = [items[k - 1], items[k]];
		if (previous.instrument === current.instrument && previous.transposition === current.transposition) {
			for (const n of current.numbers) if (!previous.numbers.includes(n)) previous.numbers.push(n);
			items.splice(k, 1);
		}
	}
	// A voice always leads: "Cello Part 5" reads "Stimme 5: Violoncello".
	const voiceIndex = items.findIndex((item) => item.instrument.voice);
	if (voiceIndex > 0) items.unshift(...items.splice(voiceIndex, 1));

	const describe = (item: Item) =>
		[
			item.instrument.name,
			// Voices are counted ("Stimme 3"), instrument parts use roman numbers ("Horn II").
			item.instrument.voice ? item.numbers.join(' & ') : formatNumbers(item.numbers),
			item.transposition ? `in ${item.transposition}` : ''
		]
			.filter(Boolean)
			.join(' ');

	// A voice ("Stimme 3") followed by instruments reads "Stimme 3: Flöte & Oboe".
	let label = '';
	items.forEach((item, index) => {
		const text = describe(item);
		if (index === 0) label = text;
		else if (items[index - 1].instrument.voice && index === 1) label += `: ${text}`;
		else label += ` ${item.joiner} ${text}`;
	});

	// Voice parts of singers ("Gesang SA", "Gesang B") keep their short voice names.
	if (items.length > 0 && items.every((item) => item.instrument.family === 'gesang')) {
		const voices = unknown.filter((token) => /^[satb]{1,4}$/.test(token)).map((t) => t.toUpperCase());
		if (voices.length) label += ` ${voices.join(' ')}`;
	}

	const soloNote = naming.partNotes.solo ?? 'Solo';
	if (items.length === 0 && notes.includes(soloNote)) {
		// "Barcarolle-Solo.pdf": the solo part, instrument not named.
		label = soloNote;
	}

	const first = items[0];
	const isAudio = mimeType.startsWith('audio/');
	let kind: PartKind;
	if (isAudio) kind = 'audio';
	else if (!first && notes.includes(soloNote)) kind = 'solo';
	else if (!first) kind = 'sonstiges';
	else if (first.instrument.family === 'partitur') kind = 'partitur';
	else if (featured || notes.includes(soloNote)) kind = 'solo';
	else if (items.filter((item) => !item.instrument.voice).length > 1 || first.numbers.length > 1) kind = 'sammelstimme';
	else kind = 'stimme';

	if (!label) {
		// Nothing recognised: show the readable rest of the name.
		label = name.replace(/[_]+/g, ' ').replace(/\s+-\s+/g, ' – ').trim() || fileName;
	}

	const instrumentIndex = first ? (matcher.order.get(first.instrument) ?? 999) : 999;
	const order =
		(kind === 'partitur' ? 0 : kind === 'solo' ? 1 : kind === 'audio' || kind === 'sonstiges' ? 9 : 2) * 1_000_000 +
		instrumentIndex * 1000 +
		(first?.numbers[0] ?? 0) * 10 +
		Math.min(items.length, 9);

	return {
		label,
		kind,
		family: first?.instrument.family,
		instruments: [...new Set(items.filter((i) => !i.instrument.voice).map((i) => i.instrument.name))],
		voices: items
			.filter((i) => !i.instrument.voice)
			.map((i) => ({ instrument: i.instrument.name, numbers: [...i.numbers] })),
		notes,
		status,
		featured,
		order
	};
}
