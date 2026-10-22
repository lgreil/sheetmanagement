import { bachkreis } from './presets/bachkreis.ts';
import type { Instrument, OrchestraConfig } from './types.ts';

export type * from './types.ts';

/**
 * The active preset. To adapt the app for another orchestra, add a preset and select it here.
 * Dates follow the app's language (#124): an English build shows them the British way.
 */
export const config: OrchestraConfig = __LANGUAGE__ === 'en' && bachkreis.locale.startsWith('de') ? { ...bachkreis, locale: 'en-GB' } : bachkreis;

/** The preset's instruments, before a deployment's own labels and spellings. */
export const PRESET_INSTRUMENTS: Instrument[] = config.instruments;

/** A deployment's own word for an instrument and more spellings in its file names (#143). */
export interface InstrumentOverride {
	/** Shown in the app instead of the file names' word; the word itself shows no label. */
	label?: string;
	/** Added to the preset's aliases. */
	aliases?: string[];
}

let applied = '';
let current: Record<string, InstrumentOverride> = {};

/** The overrides in use, for the root layout to apply in the browser too. */
export const instrumentOverrides = () => current;

/**
 * Applies the labels and spellings from the sheet's "Instrumente" tab to `config.instruments`, so
 * every part of the app reads them. They're the same for every request of a deployment: the server
 * hook sets them from the cached sheet and the root layout sets the same ones in the browser.
 */
export function useInstrumentOverrides(overrides: Record<string, InstrumentOverride>) {
	const key = JSON.stringify(overrides);
	if (key === applied) return;
	applied = key;
	current = overrides;
	// Without overrides the preset's own list, so caches keyed by it stay valid.
	if (!Object.keys(overrides).length) {
		config.instruments = PRESET_INSTRUMENTS;
		return;
	}
	config.instruments = PRESET_INSTRUMENTS.map((instrument) => {
		const override = overrides[instrument.name];
		if (!override) return instrument;
		const label = override.label?.trim();
		return {
			...instrument,
			label: label ? (label === instrument.name ? undefined : label) : instrument.label,
			aliases: [...(instrument.aliases ?? []), ...(override.aliases ?? [])]
		};
	});
}
