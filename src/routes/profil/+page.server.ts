import { fail, redirect } from '@sveltejs/kit';
import { currentStatus, normalizeEmail } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { commonInstruments, parseInstruments, playableInstruments } from '#lib/music/my-parts.ts';
import { readMemberForm, today, writable } from '#lib/server/members.ts';
import { getAccessList } from '#lib/server/repertoire.ts';
import { authConfig } from '#lib/server/auth/index.ts';
import { feedToken } from '#lib/server/auth/feed.ts';
import { isOn } from '#lib/server/env.ts';
import { nextLinkVersion, revokedLinkVersion } from '#lib/server/auth/links.ts';
import { readTab, refreshAfterWrite, SheetLayoutError, updateRecord } from '#lib/server/sheet-writes.ts';
import type { Actions, PageServerLoad } from './$types';

/** A member's own row in "Mitglieder": name, instruments, orchestras and status. Groups and rights stay with /admin. */
export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.access.user;
	if (locals.auth === 'off' || !user) redirect(303, '/meine-noten');
	const list = await getAccessList();
	const member = list?.membersByEmail.get(normalizeEmail(user.email));
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
		feed: await feed(member.email, member.feedVersion, !!list?.tables.members?.missing.includes('feedVersion'), url.origin),
		instruments: playableInstruments(config),
		common: commonInstruments(config),
		orchestras: config.orchestras
	};
};

/** The personal calendar link (#122): its address while valid, else whether one can be made. */
async function feed(email: string, version: number, missingColumn: boolean, origin: string) {
	const auth = authConfig();
	if (auth.mode !== 'on' || !isOn('calendarFeed')) return null;
	if (missingColumn) return { state: 'not-set-up' as const };
	if (version < 1) return { state: 'none' as const };
	const url = `${origin}/kalender/${await feedToken(email, version, auth.sessionSecret)}.ics`;
	return { state: 'active' as const, url, webcal: url.replace(/^https?:/, 'webcal:') };
}

/** A new link (a higher version) or revoking (the version made negative), on the member's own row. */
async function changeFeed(locals: App.Locals, next: (current: number) => number) {
	const user = locals.access.user;
	if (locals.auth === 'off' || !user) redirect(303, '/anmelden');
	if (!isOn('calendarFeed')) return fail(404, { feedMessage: t.error.notFound });
	try {
		const members = await readTab('members');
		const email = normalizeEmail(user.email);
		const row = members.rows.find((r) => normalizeEmail(r.values.email) === email);
		if (!row) return fail(404, { feedMessage: t.profile.gone });
		const current = Number.parseInt(row.values.feedVersion, 10) || 0;
		await updateRecord('members', members, row.row, { feedVersion: String(next(current)) });
		await refreshAfterWrite();
		return { feedSaved: true };
	} catch (error) {
		if (error instanceof SheetLayoutError) return fail(409, { feedMessage: t.feed.notSetUp });
		console.error('Changing a calendar link failed:', error);
		return fail(503, { feedMessage: t.feed.failed });
	}
}

export const actions: Actions = {
	feed: ({ locals }) => changeFeed(locals, nextLinkVersion),
	feedRevoke: ({ locals }) => changeFeed(locals, revokedLinkVersion),

	save: async ({ locals, request }) => {
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
