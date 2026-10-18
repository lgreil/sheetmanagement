import type { OrchestraConfig } from '#lib/config/index.ts';
import { createInstrumentMatcher, parsePartName, type InstrumentMatcher } from './part-name.ts';
import { formatNumbers } from './text.ts';
import type { Part, PieceDetail } from './types.ts';

/**
 * Which parts of a piece someone plays from: "Meine Noten" for one member, and the
 * instrumentation check for a whole programme. Both use the instruments and numbers
 * the file-name parser read, plus the orchestra's shared parts (B-Stimmen …).
 */

/** What a member plays, e.g. Geige 2 or Klarinette (any part). */
export interface InstrumentChoice {
	instrument: string;
	/** Undefined: every part of the instrument. */
	number?: number;
}

const matchers = new WeakMap<OrchestraConfig, InstrumentMatcher>();
const matcherFor = (config: OrchestraConfig) => {
	let matcher = matchers.get(config);
	if (!matcher) matchers.set(config, (matcher = createInstrumentMatcher(config.instruments)));
	return matcher;
};

/**
 * Reads what members write in "Instrument", the way part file names are read:
 * "Geige 2", "2. Violine", "Violin II", "Cello", "Klarinette in B". Null if no instrument is recognised.
 */
export function parseInstrument(text: string, config: OrchestraConfig): InstrumentChoice | null {
	if (!text.trim()) return null;
	const parsed = parsePartName(text, 'text/plain', config.naming, matcherFor(config));
	const voice = parsed.voices[0];
	if (!voice) return null;
	return voice.numbers.length === 1 ? { instrument: voice.instrument, number: voice.numbers[0] } : { instrument: voice.instrument };
}

/** "Geige II", "Klarinette": how a choice is shown and stored back in "Instrument". */
export function formatInstrument(choice: InstrumentChoice): string {
	return choice.number ? `${choice.instrument} ${formatNumbers([choice.number])}` : choice.instrument;
}

/** Shared parts that include the instrument, e.g. Klarinette → ["B-Stimmen", "Holz"]. */
export function sharedPartsFor(instrument: string, config: OrchestraConfig): string[] {
	return Object.entries(config.sharedParts ?? {})
		.filter(([, players]) => players.includes(instrument))
		.map(([name]) => name);
}

/** Parts that aren't music for a player: recordings and unrecognised files. */
const isPlayable = (part: Part) => part.kind !== 'audio' && part.kind !== 'sonstiges';

/** The part is written for this instrument, with this number or for every number. */
function isOwn(part: Part, choice: InstrumentChoice): boolean {
	return part.voices.some(
		(voice) =>
			voice.instrument === choice.instrument &&
			(choice.number === undefined || voice.numbers.length === 0 || voice.numbers.includes(choice.number))
	);
}

export interface PartMatch {
	/** Written for the instrument (and number): "Geige II", "Geige I & II", "Violoncello & Kontrabass". */
	own: Part[];
	/** Shared parts the instrument may play from: "C-Stimmen", "Holz". */
	shared: Part[];
}

/** The parts of the section people play (the first one), as the piece page opens them. */
export function playedParts(detail: Pick<PieceDetail, 'parts' | 'sections'>): Part[] {
	const played = detail.sections[0]?.key;
	return detail.parts.filter((part) => isPlayable(part) && (played === undefined || part.section === played));
}

export function matchParts(parts: Part[], choice: InstrumentChoice, config: OrchestraConfig): PartMatch {
	const groups = new Set(sharedPartsFor(choice.instrument, config));
	let own = parts.filter((part) => isOwn(part, choice));
	// The soloist's part only when there is nothing else for the instrument.
	const regular = own.filter((part) => part.kind !== 'solo');
	if (regular.length) own = regular;
	// "Geige II" beats a plain "Geige", which is then usually the first violins' part.
	const exact = own.filter((part) =>
		part.voices.some((voice) => voice.instrument === choice.instrument && choice.number !== undefined && voice.numbers.includes(choice.number))
	);
	if (exact.length) own = exact;
	const shared = parts.filter((part) => !own.includes(part) && part.instruments.some((name) => groups.has(name)));
	return { own, shared };
}

/**
 * How well a piece is covered for one instrument, for the instrumentation check:
 * its own part is there · a shared part covers it · its part is marked FEHLT/LEER/UNVOLLSTÄNDIG · nothing.
 */
export type Coverage = 'own' | 'shared' | 'problem' | 'none';

export function coverage(parts: Part[], instrument: string, config: OrchestraConfig): Coverage {
	const { own, shared } = matchParts(parts, { instrument }, config);
	if (own.some((part) => part.status === 'ok')) return 'own';
	if (shared.some((part) => part.status === 'ok')) return 'shared';
	return own.length || shared.length ? 'problem' : 'none';
}

/**
 * The instruments a programme needs, in the configured order: everything with its own
 * part in one of the pieces. Shared-part names ("B-Stimmen") and the score are left out.
 */
export function programInstruments(pieces: Part[][], config: OrchestraConfig): string[] {
	// Pure group names ("B-Stimmen", "Holz") aren't columns; "Schlagwerk" is a group and an instrument.
	const sharedParts = config.sharedParts ?? {};
	const players = new Set(Object.values(sharedParts).flat());
	const shared = new Set(Object.keys(sharedParts).filter((name) => !players.has(name)));
	const used = new Set(
		pieces.flat().flatMap((part) => (part.kind === 'partitur' ? [] : part.instruments.filter((name) => !shared.has(name))))
	);
	return config.instruments
		.filter((instrument) => used.has(instrument.name) && instrument.family !== 'partitur' && !instrument.voice)
		.map((instrument) => instrument.name);
}
