/**
 * Everything an orchestra adjusts to run this app lives in one OrchestraConfig.
 * Presets in ./presets are complete examples; copy one and change what differs.
 */

export type InstrumentFamily =
	| 'partitur'
	| 'holz'
	| 'blech'
	| 'schlagwerk'
	| 'tasten'
	| 'streicher'
	| 'gesang'
	| 'sonstige';

export interface Instrument {
	/** Name as used in file names and shown in the app, e.g. "Geige". */
	name: string;
	family: InstrumentFamily;
	/** Other spellings found in file names, e.g. ["Violine", "Violin"]. Matched case-insensitively. */
	aliases?: string[];
}

export interface NamingRules {
	/** Separates title, part and status in file names: "<Titel> - <Stimme> - FEHLT.pdf". */
	separator: string;
	/** File-name prefix marking a score or a real solo part, sorted first. */
	featuredPrefix: string;
	/** Status words appended to a file name. */
	status: {
		missing: string;
		empty: string;
		incomplete: string;
	};
	/** Catalogue numbers recognised in folder names, e.g. "BWV 147", "KV 492", "Op. 90". */
	cataloguePatterns: RegExp[];
}

export interface EventKeywords {
	/** Lower-case words in a calendar event title that mark its type. First match wins, in this order. */
	generalprobe: string[];
	probe: string[];
	konzert: string[];
}

export interface OrchestraConfig {
	/** Default display name; the ORCHESTRA_NAME variable overrides it per deployment. */
	name: string;
	/** Short name for the header on small screens. */
	shortName: string;
	/** Accent colour as any CSS colour. */
	accent: string;
	/** Instruments in display order; parts are sorted by this list. */
	instruments: Instrument[];
	naming: NamingRules;
	events: EventKeywords;
}
