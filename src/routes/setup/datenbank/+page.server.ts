import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { t } from '#lib/i18n/index.ts';
import { requireAdminWhenSignInIsOn } from '#lib/server/auth/index.ts';
import { dataState } from '#lib/server/data-source.ts';
import { backToSheet, exportToSheet, importFromSheet, planImport } from '#lib/server/data-transfer.ts';
import { getStore } from '#lib/server/db/index.ts';
import { isDemo } from '#lib/server/env.ts';

/**
 * Where the data lives (#186): the preview of the import, the import itself, the export into
 * the sheet and the way back. For admins only once sign-in is on, like /setup.
 */

const message = (cause: unknown) => t.dataMove.failed(cause instanceof Error ? cause.message : String(cause));

/** A real D1 database; the memory store would lose everything on the next start. */
const hasD1 = () => getStore().kind === 'd1' || isDemo();

export const load: PageServerLoad = async ({ locals }) => {
	requireAdminWhenSignInIsOn(locals);
	const state = await dataState({ force: true });
	if (state.source === 'd1') {
		const data = await getStore().readData();
		return { source: state.source, hasD1: true, rows: Object.values(data).reduce((sum, rows) => sum + rows.length, 0), plan: null, problem: null };
	}
	if (!hasD1()) return { source: state.source, hasD1: false, rows: 0, plan: null, problem: null };
	try {
		return { source: state.source, hasD1: true, rows: 0, plan: await planImport(), problem: null };
	} catch (cause) {
		return { source: state.source, hasD1: true, rows: 0, plan: null, problem: message(cause) };
	}
};

export const actions: Actions = {
	import: async ({ locals }) => {
		requireAdminWhenSignInIsOn(locals);
		if (!hasD1()) return fail(400, { problem: t.dataMove.noD1 });
		try {
			const plan = await importFromSheet();
			return { done: t.dataMove.imported(plan.rows, plan.tabs.length) };
		} catch (cause) {
			console.error('Importing the sheet failed:', cause);
			return fail(500, { problem: message(cause) });
		}
	},
	export: async ({ locals }) => {
		requireAdminWhenSignInIsOn(locals);
		try {
			const { tabs, rows } = await exportToSheet();
			return { done: t.dataMove.exported(rows, tabs) };
		} catch (cause) {
			console.error('Exporting to the sheet failed:', cause);
			return fail(500, { problem: message(cause) });
		}
	},
	back: async ({ locals }) => {
		requireAdminWhenSignInIsOn(locals);
		try {
			await backToSheet();
			return { done: t.dataMove.back };
		} catch (cause) {
			console.error('Going back to the sheet failed:', cause);
			return fail(500, { problem: message(cause) });
		}
	}
};
