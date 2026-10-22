import type { InstrumentFamily } from '#lib/config/types.ts';

/**
 * Which little drawing the instrument picker shows for an instrument: the name decides
 * ("Bassklarinette" is a clarinet), else its family, so an orchestra's own instruments get one too.
 */
export type Glyph =
	| 'violin'
	| 'cello'
	| 'flute'
	| 'clarinet'
	| 'sax'
	| 'horn'
	| 'trumpet'
	| 'trombone'
	| 'tuba'
	| 'timpani'
	| 'drum'
	| 'cymbal'
	| 'mallets'
	| 'keys'
	| 'harp'
	| 'voice'
	| 'score';

// First match wins, so "Englischhorn" is a clarinet before "horn" makes it a horn.
const BY_NAME: [RegExp, Glyph][] = [
	[/saxophon/, 'sax'],
	[/oboe|englischhorn|klarinette|fagott/, 'clarinet'],
	[/fl(ö|oe)te|piccolo/, 'flute'],
	[/horn/, 'horn'],
	[/trompete|kornett|fl(ü|ue)gelhorn/, 'trumpet'],
	[/posaune/, 'trombone'],
	[/tuba|bariton|euphonium/, 'tuba'],
	[/pauke/, 'timpani'],
	[/glockenspiel|xylophon|vibraphon|marimba|mallet/, 'mallets'],
	[/becken|tamtam|gong/, 'cymbal'],
	[/cello|kontrabass|e-bass/, 'cello'],
	[/geige|viola|violine/, 'violin'],
	[/klavier|cembalo|orgel|synthesizer|continuo|piano/, 'keys'],
	[/harfe/, 'harp'],
	[/sopran|alt$|tenor$|bass$|chor|gesang/, 'voice']
];

const BY_FAMILY: Record<InstrumentFamily, Glyph> = {
	partitur: 'score',
	holz: 'clarinet',
	blech: 'trumpet',
	schlagwerk: 'drum',
	tasten: 'keys',
	gesang: 'voice',
	streicher: 'violin',
	sonstige: 'score'
};

export function instrumentGlyph(name: string, family: InstrumentFamily | undefined): Glyph {
	const word = name.toLowerCase();
	return BY_NAME.find(([pattern]) => pattern.test(word))?.[1] ?? (family ? BY_FAMILY[family] : 'score');
}
