import { t } from '#lib/i18n/index.ts';
import { formatDuration } from './duration.ts';

/**
 * The music list for the collecting society (GEMA "Musikfolge", #118): per piece in the
 * programme its title, composer, arranger, publisher and duration, as a printable table
 * and a CSV file to paste from. Column names live in the texts, so another country's
 * society only needs other words.
 */

export interface ReportPiece {
	pieceId?: string;
	title: string;
	composer?: string;
	arranger?: string;
	publisher?: string;
	/** Seconds. */
	duration?: number;
}

/** What the society needs for every piece; the arranger only exists for arrangements. */
export const REQUIRED = ['composer', 'publisher', 'duration'] as const;
export type RequiredField = (typeof REQUIRED)[number];

export interface ReportGap {
	pieceId?: string;
	title: string;
	missing: RequiredField[];
}

/** Pieces with something missing, in programme order, so it can be filled in before the export. */
export function reportGaps(pieces: ReportPiece[]): ReportGap[] {
	return pieces
		.map((piece) => ({ pieceId: piece.pieceId, title: piece.title, missing: REQUIRED.filter((field) => !piece[field]) }))
		.filter((gap) => gap.missing.length);
}

/** Header and one row per piece, as shown and exported. */
export function reportRows(pieces: ReportPiece[]): string[][] {
	const columns = t.musicReport.columns;
	return [
		[columns.position, columns.title, columns.composer, columns.arranger, columns.publisher, columns.duration],
		...pieces.map((piece, i) => [
			String(i + 1),
			piece.title,
			piece.composer ?? '',
			piece.arranger ?? '',
			piece.publisher ?? '',
			piece.duration ? formatDuration(piece.duration) : ''
		])
	];
}

/**
 * CSV the way German spreadsheet programs open it with a double click: semicolons, CRLF,
 * a byte order mark for the umlauts. Cells starting with = + - @ get a leading apostrophe,
 * so nothing in a title runs as a formula.
 */
export function toCsv(rows: string[][]): string {
	const cell = (value: string) => {
		const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
		return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
	};
	return '﻿' + rows.map((row) => row.map(cell).join(';')).join('\r\n') + '\r\n';
}
