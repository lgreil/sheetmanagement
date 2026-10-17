import type { InstrumentFamily } from '#lib/config/index.ts';

export type PartStatus = 'ok' | 'missing' | 'empty' | 'incomplete';

export type PartKind =
	/** The conductor's score. */
	| 'partitur'
	/** A featured solo part ("@" prefix or "Solo"). */
	| 'solo'
	/** One part for one instrument. */
	| 'stimme'
	/** Several instruments or voices in one file, e.g. "Pauke & Schlagwerk", "Horn I & II". */
	| 'sammelstimme'
	| 'audio'
	/** Anything without a recognised instrument. */
	| 'sonstiges';

export interface Part {
	id: string;
	fileName: string;
	/** Display name in the orchestra's convention, e.g. "Klarinette I & II in B". */
	label: string;
	kind: PartKind;
	/** Family of the first instrument, for grouping. */
	family?: InstrumentFamily;
	/** Canonical names of the instruments in this file. */
	instruments: string[];
	notes: string[];
	status: PartStatus;
	mimeType: string;
	subfolder?: string;
	/** For sorting within a piece. */
	order: number;
}

export type PieceStatus = 'ok' | 'missing' | 'incomplete' | 'empty';

export interface PieceSummary {
	id: string;
	title: string;
	composer?: string;
	catalogue?: string;
	category?: string;
	partCount: number;
	status: PieceStatus;
	/** Lower-case text without accents, for instant search on the client. */
	search: string;
}

export interface PieceDetail extends PieceSummary {
	folderName: string;
	parts: Part[];
}
