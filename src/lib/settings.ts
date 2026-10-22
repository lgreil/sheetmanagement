import { parseColour } from '#lib/branding.ts';
import { FEATURES, type Feature } from '#lib/features.ts';
import type { Table } from '#lib/repertoire/sheet.ts';

/**
 * What an admin sets on /einstellungen: name, logo, colour and the parts of the app in use.
 * Kept in the sheet's "Einstellungen" tab, one row per setting, so a deployment changes them
 * without a variable or a code change. They win over the variables, which win over the preset.
 */

/** The words in the "Einstellung" column. They stay German, since sheets depend on them. */
export const SETTING_KEYS = {
	name: 'Name',
	shortName: 'Kurzname',
	logo: 'Logo',
	accent: 'Akzentfarbe',
	featuresOff: 'Ausgeschaltet'
} as const;

export type SettingKey = keyof typeof SETTING_KEYS;

export interface StoredSettings {
	name?: string;
	shortName?: string;
	logo?: string;
	/** #rrggbb */
	accent?: string;
	/** Set once the page saved the features, even when nothing is off. */
	featuresOff?: Feature[];
}

const MAX_NAME = 80;
const MAX_SHORT_NAME = 24;

const keyOf = (word: string) =>
	(Object.entries(SETTING_KEYS) as [SettingKey, string][]).find(([, name]) => name.toLowerCase() === word.trim().toLowerCase())?.[0];

/** A logo is a path in the app ("/mein-logo.svg") or an https link; anything else could break the page. */
export function validLogo(text: string | undefined): string | undefined {
	const logo = text?.trim();
	return logo && (/^\/(?!\/)[\w./-]+$/.test(logo) || /^https:\/\/[^\s"'<>]+$/.test(logo)) ? logo : undefined;
}

/** The settings in the tab; rows with unknown names or unusable values are ignored. */
export function readSettings(rows: { values: { key: string; value: string } }[]): StoredSettings {
	const settings: StoredSettings = {};
	for (const { values } of rows) {
		const key = keyOf(values.key);
		const value = values.value.trim();
		if (key === 'name' && value) settings.name = value.slice(0, MAX_NAME);
		else if (key === 'shortName' && value) settings.shortName = value.slice(0, MAX_SHORT_NAME);
		else if (key === 'logo') settings.logo = validLogo(value);
		else if (key === 'accent') settings.accent = parseColour(value);
		else if (key === 'featuresOff') settings.featuresOff = FEATURES.filter((feature) => value.split(/[,;\s]+/).includes(feature));
	}
	return Object.fromEntries(Object.entries(settings).filter(([, value]) => value !== undefined)) as StoredSettings;
}

export type SettingsForm = { [K in SettingKey]: K extends 'featuresOff' ? Feature[] : string };

/** Checks what the page sent; the message names the first field that can't be saved. */
export function checkSettings(form: SettingsForm): { ok: true } | { ok: false; field: SettingKey } {
	if (form.name.trim().length > MAX_NAME) return { ok: false, field: 'name' };
	if (form.shortName.trim().length > MAX_SHORT_NAME) return { ok: false, field: 'shortName' };
	if (form.logo.trim() && !validLogo(form.logo)) return { ok: false, field: 'logo' };
	if (form.accent.trim() && !parseColour(form.accent)) return { ok: false, field: 'accent' };
	return { ok: true };
}

/** The rows to change and to add so the tab holds `form`: one row per setting, the first one found is kept. */
export function planSettingsSave(table: Table<'key' | 'value'>, form: SettingsForm) {
	const values: Record<SettingKey, string> = {
		name: form.name.trim(),
		shortName: form.shortName.trim(),
		logo: form.logo.trim(),
		accent: parseColour(form.accent) ?? '',
		featuresOff: form.featuresOff.join(', ')
	};
	const updates: { row: number; values: { value: string } }[] = [];
	const append: { key: string; value: string }[] = [];
	for (const key of Object.keys(SETTING_KEYS) as SettingKey[]) {
		const row = table.rows.find((r) => keyOf(r.values.key) === key);
		if (row) {
			if (row.values.value !== values[key]) updates.push({ row: row.row, values: { value: values[key] } });
		} else {
			append.push({ key: SETTING_KEYS[key], value: values[key] });
		}
	}
	return { updates, append };
}
