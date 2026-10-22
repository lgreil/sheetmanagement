import { error, fail } from '@sveltejs/kit';
import { FEATURES, type Feature } from '#lib/features.ts';
import { t } from '#lib/i18n/index.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { defaultSettings, features } from '#lib/server/env.ts';
import { refreshStoredSettings } from '#lib/server/repertoire.ts';
import { appendRecords, ensureTab, readTab, refreshAfterWrite, SheetLayoutError, updateRecords } from '#lib/server/sheet-writes.ts';
import { NotConfiguredError } from '#lib/server/services.ts';
import { checkSettings, planSettingsSave, readSettings, type SettingsForm } from '#lib/settings.ts';
import type { Actions, PageServerLoad } from './$types';

/**
 * Name, logo, colour and the parts of the app in use, set by an admin (#75, #134). Saved in the
 * sheet's "Einstellungen" tab; an empty field falls back to the variable or the preset.
 */

function requireAdmin(locals: App.Locals) {
	// Changes everyone's app, so only with sign-in on and only for admins.
	if (locals.auth === 'off') error(404, t.error.notFound);
	requireRight(locals, 'mitglieder.verwalten');
}

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	let stored: ReturnType<typeof readSettings> = {};
	let sheet: 'ready' | 'not-configured' | 'failed' = 'ready';
	try {
		stored = readSettings((await readTab('settings')).rows);
	} catch (cause) {
		if (cause instanceof NotConfiguredError) sheet = 'not-configured';
		// A missing tab is created on the first save.
		else if (!(cause instanceof SheetLayoutError)) {
			console.error('Reading the settings failed:', cause);
			sheet = 'failed';
		}
	}
	const defaults = defaultSettings();
	const on = features();
	return {
		sheet,
		values: {
			name: stored.name ?? '',
			shortName: stored.shortName ?? '',
			logo: stored.logo ?? '',
			accent: stored.accent ?? ''
		},
		defaults: { name: defaults.name, shortName: defaults.shortName, logo: defaults.logo, accent: defaults.accent, accentLight: defaults.accentLight },
		features: FEATURES.map((feature) => ({ key: feature, on: on[feature], default: defaults.features[feature] })),
		/** Whether the page decides the features, or FEATURES_OFF and the preset still do. */
		featuresStored: !!stored.featuresOff
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		requireAdmin(locals);
		const data = await request.formData();
		const text = (name: string) => String(data.get(name) ?? '');
		const on = new Set(data.getAll('features').map(String));
		const form: SettingsForm = {
			name: text('name'),
			shortName: text('shortName'),
			logo: text('logo'),
			// The colour picker always sends a colour; "default" keeps the field empty.
			accent: data.has('accentDefault') ? '' : text('accent'),
			featuresOff: FEATURES.filter((feature: Feature) => !on.has(feature))
		};
		const check = checkSettings(form);
		// What was typed comes back, so nothing is lost when the page reloads without JavaScript.
		if (!check.ok) {
			return fail(400, {
				field: check.field,
				message: t.settings.invalid[check.field],
				values: { name: form.name, shortName: form.shortName, logo: form.logo, accent: form.accent }
			});
		}
		try {
			await ensureTab('settings');
			const table = await readTab('settings');
			const plan = planSettingsSave(table, form);
			await updateRecords('settings', table, plan.updates);
			await appendRecords('settings', table, plan.append);
			// A fresh read, so the layout's colours and menu already show what was saved.
			await refreshAfterWrite();
			await refreshStoredSettings();
		} catch (cause) {
			if (cause instanceof SheetLayoutError) return fail(409, { message: cause.message });
			console.error('Saving the settings failed:', cause);
			return fail(503, { message: t.settings.failed });
		}
		return { saved: true };
	}
};
