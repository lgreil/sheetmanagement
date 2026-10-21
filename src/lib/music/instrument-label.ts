import { config } from '#lib/config/index.ts';

/**
 * Instruments as the app shows them. The config's names are the file names' words
 * ("Viola"); an instrument can have its own label for the screen ("Bratsche"), so the strings
 * read Geige · Bratsche · Cello while the naming convention stays as it is.
 */

const labels = new Map(config.instruments.flatMap((instrument) => (instrument.label ? [[instrument.name, instrument.label] as const] : [])));

/** "Viola" → "Bratsche"; names without a label stay as they are. */
export const instrumentLabel = (name: string) => labels.get(name) ?? name;

/** Back to the file names' words, e.g. for a placeholder file: "Bratsche" → "Viola". */
export function fileWords(text: string): string {
	let result = text;
	for (const [name, label] of labels) result = result.replace(new RegExp(`(^|[^\\p{L}])${label}(?=$|[^\\p{L}])`, 'gu'), `$1${name}`);
	return result;
}
