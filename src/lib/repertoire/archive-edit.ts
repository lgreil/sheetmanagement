import { parseFuzzyDate } from './dates.ts';
import { normalize, type ColumnKey, type Table } from './sheet.ts';

/**
 * Adding the orchestra's history from the app ("archiv.bearbeiten"): past concerts with
 * dates as precise as they are known, and pieces that were played but have no sheet
 * music in Drive. Programmes then use the existing programme editor.
 */

export interface NewConcert {
	date: string;
	title: string;
	location: string;
	orchestra: string;
}

export interface NewPiece {
	title: string;
	composer: string;
	catalogue: string;
}

export type ArchiveProblem = 'title-missing' | 'title-taken' | 'bad-date';

const trimmed = <T extends object>(values: T): T =>
	Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value).trim()])) as T;

/** Programme rows refer to concerts by "Anlass", and to pieces by title: both must be unique. */
const taken = (table: Table<string>, title: string) => {
	const wanted = normalize(title);
	return table.rows.some((row) => normalize(row.values.title ?? '') === wanted);
};

export function checkNewConcert(
	input: NewConcert,
	concerts: Table<ColumnKey<'concerts'> & string>
): { values: NewConcert } | { problem: ArchiveProblem } {
	const values = trimmed(input);
	if (!values.title) return { problem: 'title-missing' };
	// "1957", "1957-12", "21.12.1957" … or empty when nobody knows.
	if (values.date && !parseFuzzyDate(values.date)) return { problem: 'bad-date' };
	if (taken(concerts, values.title)) return { problem: 'title-taken' };
	return { values };
}

export function checkNewPiece(
	input: NewPiece,
	pieces: Table<ColumnKey<'pieces'> & string>
): { values: NewPiece } | { problem: ArchiveProblem } {
	const values = trimmed(input);
	if (!values.title) return { problem: 'title-missing' };
	if (taken(pieces, values.title)) return { problem: 'title-taken' };
	return { values };
}
