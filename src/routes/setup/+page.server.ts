import { fail } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { requireAdminWhenSignInIsOn } from '#lib/server/auth/index.ts';
import { LAYOUT, REPERTOIRE_TABS } from '#lib/repertoire/sheet.ts';
import { GoogleApiError } from '#lib/server/google/client.ts';
import { getSpreadsheetInfo } from '#lib/server/google/sheets.ts';
import { getAccessList, getRepertoire } from '#lib/server/repertoire.ts';
import { setUpSheet } from '#lib/server/repertoire-setup.ts';
import { getGoogle, NotConfiguredError, requireSetting } from '#lib/server/services.ts';
import type { Actions, PageServerLoad } from './$types';

// While sign-in is off (no GOOGLE_OAUTH_CLIENT_ID), anyone who can open the app can run
// this, which is how a new deployment gets set up. It only adds missing tabs, columns,
// formatting and dropdowns. Once sign-in is on, it's for admins only.

function describe(error: unknown): string {
	if (error instanceof NotConfiguredError) return `${error.variable} ist nicht gesetzt.`;
	if (error instanceof GoogleApiError) return `${error.message} (${error.status})`;
	return error instanceof Error ? error.message : String(error);
}

export const load: PageServerLoad = async ({ locals }) => {
	requireAdminWhenSignInIsOn(locals);
	let serviceAccountEmail: string | undefined;
	try {
		const spreadsheetId = requireSetting('REPERTOIRE_SHEET_ID');
		const { client, serviceAccountEmail: email } = getGoogle();
		serviceAccountEmail = email;
		const info = await getSpreadsheetInfo(client, spreadsheetId);
		const tabs = Object.values(LAYOUT).map(({ tab }) => ({ name: tab, present: info.tabs.includes(tab) }));
		const ready = REPERTOIRE_TABS.every((key) => info.tabs.includes(LAYOUT[key].tab));
		const [repertoire, access] = ready ? await Promise.all([getRepertoire(), getAccessList()]) : [null, null];
		return {
			state: 'ready' as const,
			serviceAccountEmail,
			title: info.title,
			url: `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/edit`,
			tabs,
			counts: repertoire?.ok
				? {
						pieces: repertoire.repertoire.pieces.length,
						concerts: repertoire.repertoire.concerts.length,
						program: repertoire.repertoire.concerts.reduce((sum, c) => sum + c.program.length, 0)
					}
				: null,
			problems: [...(repertoire?.ok ? repertoire.repertoire.problems : []), ...(access?.problems ?? [])]
		};
	} catch (error) {
		if (error instanceof NotConfiguredError && error.variable === 'REPERTOIRE_SHEET_ID') {
			return { state: 'not-configured' as const, serviceAccountEmail };
		}
		return { state: 'failed' as const, serviceAccountEmail, problem: describe(error) };
	}
};

export const actions: Actions = {
	default: async ({ locals }) => {
		requireAdminWhenSignInIsOn(locals);
		try {
			const result = await setUpSheet(getGoogle().client, requireSetting('REPERTOIRE_SHEET_ID'), {
				orchestras: config.orchestras,
				sharedParts: config.sharedParts
			});
			// Read the new tabs right away, which also adds the pieces and concerts.
			await getRepertoire({ force: true });
			return { result };
		} catch (error) {
			console.error('Setting up the sheet failed:', error);
			return fail(500, { problem: describe(error) });
		}
	}
};
