import { fail, redirect } from '@sveltejs/kit';
import { currentStatus, normalizeEmail } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { commonInstruments, parseInstruments, playableInstruments } from '#lib/music/my-parts.ts';
import { readMemberForm, today, writable } from '#lib/server/members.ts';
import { getAccessList } from '#lib/server/repertoire.ts';
import { readTab, refreshAfterWrite, SheetLayoutError, updateRecord } from '#lib/server/sheet-writes.ts';
import type { Actions, PageServerLoad } from './$types';

/** A member's own row in "Mitglieder": name, instruments, orchestras and status. Groups and rights stay with /admin. */
export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.access.user;
	if (locals.auth === 'off' || !user) redirect(303, '/meine-noten');
	const member = (await getAccessList())?.membersByEmail.get(normalizeEmail(user.email));
	if (!member) return { member: null, email: user.email };
	return {
		email: member.email,
		member: {
			name: member.name,
			choices: parseInstruments(member.instrument ?? '', config),
			orchestras: member.orchestras,
			status: member.status,
			pausedUntil: member.pausedUntil,
			current: currentStatus(member, today()),
			groups: member.groups
		},
		instruments: playableInstruments(config),
		common: commonInstruments(config),
		orchestras: config.orchestras
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const user = locals.access.user;
		if (locals.auth === 'off' || !user) redirect(303, '/anmelden');
		const form = readMemberForm(await request.formData());
		if ('problem' in form) return fail(400, { message: form.problem });
		try {
			// Only the member's own row, found by the signed-in email.
			const members = await readTab('members');
			const email = normalizeEmail(user.email);
			const row = members.rows.find((r) => normalizeEmail(r.values.email) === email);
			if (!row) return fail(404, { message: t.profile.gone });
			await updateRecord('members', members, row.row, writable(members, { ...form.values, name: form.values.name || row.values.name }));
			await refreshAfterWrite();
			return { saved: true };
		} catch (error) {
			if (error instanceof SheetLayoutError) return fail(409, { message: error.message });
			console.error('Saving a profile failed:', error);
			return fail(503, { message: t.profile.failed });
		}
	}
};
