import { tidyCatalogue } from './score-text.ts';
import { searchText } from './text.ts';

/**
 * Looks up a work on Wikidata, from the browser and only on request: composer, catalogue
 * number, year and what kind of work it is. Wikidata is free, needs no key and allows
 * requests from other sites (origin=*). The app's server isn't involved.
 */

const API = 'https://www.wikidata.org/w/api.php';
const LANGUAGES = 'de|en';

export interface WorkCandidate {
	id: string;
	label: string;
	description?: string;
}

export interface WorkDetails {
	id: string;
	url: string;
	label: string;
	/** Full names, as Wikidata has them ("Johann Sebastian Bach"). */
	composers: string[];
	/** "BWV 565", "Op. 24" */
	catalogue?: string;
	year?: number;
	/** What kind of work and its genres, in German where Wikidata has it ("Ballett", "Filmmusik"). */
	kinds: string[];
	/** A video id, rare for works. */
	youtube?: string;
}

type Fetch = typeof fetch;
type Json = Record<string, any>;

/** Wikidata asks for a pause (HTTP 429): too many lookups in a short time. */
export class WikidataBusyError extends Error {
	constructor() {
		super('Wikidata: 429');
		this.name = 'WikidataBusyError';
	}
}

async function call(params: Record<string, string>, fetchImpl: Fetch): Promise<Json> {
	const url = `${API}?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`;
	const response = await fetchImpl(url);
	if (response.status === 429) throw new WikidataBusyError();
	if (!response.ok) throw new Error(`Wikidata: ${response.status}`);
	return response.json();
}

const labelOf = (entity: Json | undefined) => entity?.labels?.de?.value ?? entity?.labels?.en?.value ?? '';
const descriptionOf = (entity: Json | undefined) => entity?.descriptions?.de?.value ?? entity?.descriptions?.en?.value;

/** Words that name a form, not a work: left out when the whole title finds nothing. */
const GENERIC_WORDS = new Set(
	(
		'overture ouvertüre ouverture suite medley selections selection highlights theme themes from aus the der die das ' +
		'and und for für no nr op opus march marsch main title music musik orchestra orchester version arrangement'
	).split(' ')
);

/** The queries tried in turn: title and surname, the title's distinctive words and surname, the title alone. */
export function searchQueries(title: string, composer?: string): string[] {
	const surname = composer?.split(/,|&|\band\b|\bund\b/)[0].trim().split(/\s+/).at(-1) ?? '';
	const words = title
		.replace(/[()[\]"„“”:,.!?]/g, ' ')
		.split(/\s+/)
		.filter((word) => word.length > 2 && !GENERIC_WORDS.has(word.toLowerCase()) && !/^\d+$/.test(word));
	const queries = [
		surname ? `${title} ${surname}` : '',
		words.length && (surname || words.join(' ') !== title) ? `${words.join(' ')} ${surname}`.trim() : '',
		title
	];
	return [...new Set(queries.filter(Boolean))];
}

/**
 * Works with a composer (P86) matching the title, best first. Wikidata's search is strict
 * about request rates, so the queries stop at the first that finds something.
 */
export async function searchWorks(title: string, composer: string | undefined, fetchImpl: Fetch = fetch): Promise<WorkCandidate[]> {
	let ids: string[] = [];
	for (const query of searchQueries(title, composer)) {
		const result = await call({ action: 'query', list: 'search', srsearch: `${query} haswbstatement:P86`, srlimit: '5' }, fetchImpl);
		ids = (result.query?.search ?? []).map((hit: Json) => hit.title as string);
		if (ids.length) break;
	}
	if (!ids.length) return [];
	const entities = (await call({ action: 'wbgetentities', ids: ids.join('|'), props: 'labels|descriptions', languages: LANGUAGES }, fetchImpl)).entities ?? {};
	return ids.map((id: string) => ({ id, label: labelOf(entities[id]) || id, description: descriptionOf(entities[id]) }));
}

const ids = (claims: Json, property: string): string[] =>
	(claims[property] ?? []).map((claim: Json) => claim.mainsnak?.datavalue?.value?.id).filter((id: unknown): id is string => typeof id === 'string');

/** The year of a time value, if it's at least year-precise: "+1883-01-01T00:00:00Z" → 1883. */
export function yearOf(claims: Json): number | undefined {
	for (const property of ['P571', 'P577', 'P1191']) {
		for (const claim of claims[property] ?? []) {
			const value = claim.mainsnak?.datavalue?.value;
			if (value?.time && value.precision >= 9) return Number(value.time.slice(1, 5));
		}
	}
	return undefined;
}

/** Catalogue numbers (P528) with the catalogue they belong to (qualifier P972). */
export function catalogueClaims(claims: Json): { number: string; catalogue?: string }[] {
	return (claims.P528 ?? [])
		.map((claim: Json) => ({
			number: String(claim.mainsnak?.datavalue?.value ?? ''),
			catalogue: claim.qualifiers?.P972?.[0]?.datavalue?.value?.id as string | undefined
		}))
		.filter((entry: { number: string }) => entry.number);
}

/** Generic kinds that say nothing about a piece: "musical work", "composition". */
const GENERIC = new Set(['Q105543609', 'Q207628', 'Q2188189', 'Q17537576']);

export async function workDetails(id: string, fetchImpl: Fetch = fetch): Promise<WorkDetails> {
	const work = (await call({ action: 'wbgetentities', ids: id, props: 'labels|claims', languages: LANGUAGES }, fetchImpl)).entities?.[id] ?? {};
	const claims = work.claims ?? {};
	const composers = ids(claims, 'P86');
	const kinds = [...ids(claims, 'P136'), ...ids(claims, 'P31')].filter((kind) => !GENERIC.has(kind));
	const catalogues = catalogueClaims(claims);
	const catalogueIds = catalogues.flatMap((entry) => entry.catalogue ?? []);

	// Names of composers and kinds in one request; the catalogues' short names ("BWV") in another, small one.
	const related = [...new Set([...composers, ...kinds])].slice(0, 50);
	const [names, catalogueEntities] = await Promise.all([
		related.length ? call({ action: 'wbgetentities', ids: related.join('|'), props: 'labels', languages: LANGUAGES }, fetchImpl) : { entities: {} },
		catalogueIds.length
			? call({ action: 'wbgetentities', ids: catalogueIds.join('|'), props: 'labels|claims', languages: LANGUAGES }, fetchImpl)
			: { entities: {} }
	]);
	const label = labelOf(work);
	let catalogue: string | undefined;
	const first = catalogues[0];
	if (first) {
		const entity = first.catalogue ? catalogueEntities.entities?.[first.catalogue] : undefined;
		const short = entity?.claims?.P1813?.find((claim: Json) => ['de', 'en'].includes(claim.mainsnak?.datavalue?.value?.language))
			?.mainsnak.datavalue.value.text;
		catalogue = short ? tidyCatalogue(`${short} ${first.number}`) : /[a-z]/i.test(first.number) ? tidyCatalogue(first.number) : undefined;
	}
	// Without a catalogue claim, an opus number in the name: "Sinfonie Nr. 9 op. 125".
	catalogue ??= label.match(/\b(?:op\.?|opus)\s*\d+[a-z]?(?:\s*(?:nr\.?|no\.?)\s*\d+)?/i)?.[0].replace(/^opus/i, 'Op.').replace(/no\.?/i, 'Nr.');
	if (catalogue) catalogue = tidyCatalogue(catalogue);

	return {
		id,
		url: `https://www.wikidata.org/wiki/${id}`,
		label,
		composers: composers.map((composer) => labelOf(names.entities?.[composer])).filter(Boolean),
		catalogue,
		year: yearOf(claims),
		kinds: [...new Set(kinds.map((kind) => labelOf(names.entities?.[kind])).filter(Boolean))],
		youtube: claims.P1651?.[0]?.mainsnak?.datavalue?.value
	};
}

/** Letters only, lower case, without accents: "Tschaikowski" and "Tschaikowsky" become close. */
const bare = (text: string) => searchText(text).replace(/[^a-z]/g, '');

function distance(a: string, b: string): number {
	const row = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		let previous = row[0];
		row[0] = i;
		for (let j = 1; j <= b.length; j++) {
			const current = row[j];
			row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
			previous = current;
		}
	}
	return row[b.length];
}

/**
 * How to write a composer the archive's way: a known surname in its usual spelling
 * ("Pjotr Iljitsch Tschaikowski" → "Tschaikowsky"), else the full name.
 */
export function composerAsUsual(fullName: string, known: string[]): string {
	const surname = bare(fullName.split(/\s+/).at(-1) ?? '');
	const match = known
		.map((name) => ({ name, gap: distance(bare(name.split(/\s+/).at(-1) ?? ''), surname) }))
		.filter(({ gap, name }) => gap <= Math.max(1, Math.floor(bare(name).length / 5)))
		.sort((a, b) => a.gap - b.gap)[0];
	return match?.name ?? fullName;
}

/**
 * A genre in the archive's words: from Wikidata's kinds, the work's year or the archive's
 * category, matched to a genre in use or offered. Undefined when nothing fits.
 */
export function suggestGenre(
	hints: { kinds?: string[]; year?: number; category?: string; title?: string },
	genres: string[]
): string | undefined {
	const has = (name: string) => genres.find((genre) => bare(genre) === bare(name));
	const text = searchText([...(hints.kinds ?? []), hints.category ?? '', hints.title ?? ''].join(' '));
	const rules: [RegExp, string][] = [
		[/weihnacht|christmas|advent|carol/, 'Weihnachten'],
		[/film|movie|fernsehserie|television|videospiel|video game|soundtrack/, 'Filmmusik'],
		[/musical/, 'Musical'],
		[/oper\b|opera|operette|operetta/, 'Oper'],
		[/ballett|ballet/, 'Ballett'],
		[/marsch|march/, 'Marsch'],
		[/jazz|swing/, 'Jazz'],
		[/rock/, 'Rock'],
		[/\bpop|popsong|lied|song/, 'Pop'],
		[/volkslied|volksmusik|folk/, 'Volksmusik']
	];
	for (const [pattern, genre] of rules) if (pattern.test(text) && has(genre)) return has(genre);
	// Classical works by their year: the usual epochs.
	if (hints.year) {
		const epoch = hints.year < 1750 ? 'Barock' : hints.year < 1820 ? 'Klassik' : hints.year < 1910 ? 'Romantik' : undefined;
		if (epoch && has(epoch)) return has(epoch);
	}
	return undefined;
}
