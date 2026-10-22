import { error } from '@sveltejs/kit';
import { env, waitUntil } from 'cloudflare:workers';
import { brandColours, brandStyle, parseColour } from '#lib/branding.ts';
import { config } from '#lib/config/index.ts';
import { resolveFeatures, type Feature } from '#lib/features.ts';
import type { KvStore } from './cache.ts';

/**
 * Deployment settings. Set them with `wrangler secret put <NAME>` in production
 * and in `.dev.vars` locally; see `.dev.vars.example`.
 */
export interface AppEnv {
	ORCHESTRA_NAME?: string;
	ORCHESTRA_SHORT_NAME?: string;
	/** The orchestra's square logo: a path in the app ("/demo/musterorchester.svg") or an https link. Default: /logo.png. */
	ORCHESTRA_LOGO?: string;
	/** Accent colour as #rrggbb, e.g. "#1d4ed8"; the shades for light and dark are derived from it (#75). Default: the preset's. */
	ORCHESTRA_ACCENT?: string;
	/** Parts of the app this orchestra doesn't use, comma-separated: "leihmaterial, gema, anwesenheit" (#134); see src/lib/features.ts. */
	FEATURES_OFF?: string;
	GOOGLE_SERVICE_ACCOUNT_JSON?: string;
	CALENDAR_ID?: string;
	DRIVE_ARCHIVE_FOLDER_ID?: string;
	DRIVE_CURRENT_PROGRAM_FOLDER_ID?: string;
	REPERTOIRE_SHEET_ID?: string;
	/** "true" lets the app mirror problem reports into Drive (comments, status words in file names). Needs the service account as editor. */
	DRIVE_WRITE?: string;
	/** Google sign-in (OAuth client of type "Web application"). Without it the app is open and read-only. */
	GOOGLE_OAUTH_CLIENT_ID?: string;
	GOOGLE_OAUTH_CLIENT_SECRET?: string;
	/** At least 32 random characters; signs the session cookies. */
	SESSION_SECRET?: string;
	/** "false" turns sign-in off although GOOGLE_OAUTH_CLIENT_ID is set: the app is then open and read-only. Default: on. */
	FORCE_AUTH?: string;
	/** Comma-separated emails that always have every right. */
	BOOTSTRAP_ADMINS?: string;
	/** Who is responsible for the app, for the privacy notice (defaults to ORCHESTRA_NAME). */
	LEGAL_NAME?: string;
	/** Postal address of the responsible person or club, e.g. "Musterstraße 1, 12345 Musterstadt". */
	LEGAL_ADDRESS?: string;
	/** Contact email for privacy questions. */
	LEGAL_EMAIL?: string;
	/** YouTube Data API key: suggests a piece's duration from its Hörbeispiel (#133). Optional. */
	YOUTUBE_API_KEY?: string;
	/** "true": sample data instead of Google, signed in as a demo user; for trying the app (#121). */
	DEMO?: string;
	/** KV namespace binding from wrangler.toml; optional, memory is used without it. */
	CACHE?: KvStore;
}

export function appEnv(): AppEnv {
	return env as unknown as AppEnv;
}

/** The logo for header, calendar and app icon; ORCHESTRA_LOGO if it is a path or a web link. */
export function orchestraLogo(): string {
	const logo = appEnv().ORCHESTRA_LOGO?.trim();
	return logo && (/^\/(?!\/)[\w./-]+$/.test(logo) || /^https:\/\/\S+$/.test(logo)) ? logo : '/logo.png';
}

/** Name, short name, logo and colours of this deployment: the variables, else the preset. */
export function orchestra() {
	const env = appEnv();
	const name = env.ORCHESTRA_NAME?.trim();
	const accent = parseColour(env.ORCHESTRA_ACCENT);
	const colours = brandColours(accent ?? parseColour(config.accent) ?? '#e6b422');
	return {
		name: name || config.name,
		// A custom name without a custom short name shouldn't fall back to the preset's short name.
		shortName: env.ORCHESTRA_SHORT_NAME?.trim() || name || config.shortName,
		logo: orchestraLogo(),
		colours,
		/** The theme's custom properties for a <style> on :root; the preset's light shade unless the variable sets a colour. */
		style: brandStyle(colours, accent ? undefined : config.accentLight),
		/** The light shade is the preset's own (`accentLight`), not the derived one. */
		presetLight: !accent && !!config.accentLight,
		/** ORCHESTRA_ACCENT was set but isn't a colour; /status says so. */
		badAccent: !!env.ORCHESTRA_ACCENT?.trim() && !accent
	};
}

/** Which parts of the app are on for this deployment (#134). */
export function features() {
	return resolveFeatures(config.features, appEnv().FEATURES_OFF).features;
}

/** Words in FEATURES_OFF that name no feature, for /status. */
export function unknownFeatures(): string[] {
	return resolveFeatures(config.features, appEnv().FEATURES_OFF).unknown;
}

export const isOn = (feature: Feature) => features()[feature];

/** For the pages of a feature: they don't exist while it's off. */
export function requireFeature(feature: Feature) {
	if (!isOn(feature)) error(404, 'Diese Seite gibt es nicht.');
}

/** Demo mode: invented sample data in memory instead of Google, no real accounts. */
export function isDemo(): boolean {
	return ['true', '1', 'yes', 'on'].includes((appEnv().DEMO ?? '').trim().toLowerCase());
}

/** Lets work continue after the response is sent (e.g. a cache refresh). */
export function runInBackground(promise: Promise<unknown>) {
	waitUntil(promise);
}
