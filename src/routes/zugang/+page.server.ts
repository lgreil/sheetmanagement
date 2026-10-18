import { fail, redirect } from '@sveltejs/kit';
import { normalizeEmail } from '#lib/access/access.ts';
import { getAccessList } from '#lib/server/repertoire.ts';
import { appendRecords, readTab, refreshAfterWrite } from '#lib/server/sheet-writes.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.auth === 'off' || locals.access.member) redirect(303, '/');
	const user = locals.access.user;
	if (!user) redirect(303, '/anmelden');
	const list = await getAccessList();
	return {
		user,
		requested: !!list?.requests.some((request) => request.email === normalizeEmail(user.email)),
		canRequest: !!list?.tables.requests
	};
};

export const actions: Actions = {
	default: async ({ locals }) => {
		const user = locals.access.user;
		if (locals.auth === 'off' || !user) redirect(303, '/anmelden');
		if (locals.access.member) redirect(303, '/');
		try {
			const table = await readTab('requests');
			const email = normalizeEmail(user.email);
			// Asking twice leaves one row.
			if (!table.rows.some((row) => normalizeEmail(row.values.email) === email)) {
				const today = new Date().toISOString().slice(0, 10);
				await appendRecords('requests', table, [{ email, name: user.name, requestedAt: today }]);
				await refreshAfterWrite();
			}
			return { requested: true };
		} catch (error) {
			console.error('Saving an access request failed:', error);
			return fail(503, { failed: true });
		}
	}
};
