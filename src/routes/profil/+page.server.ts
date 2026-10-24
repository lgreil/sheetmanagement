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
import { getStore } from '#lib/server/db/index.ts';
import { vapidKeys } from '#lib/server/push/index.ts';
import { mailReady } from '#lib/server/mail/index.ts';
import { nextLinkVersion, revokedLinkVersion } from '#lib/server/auth/links.ts';
import { readOutcome } from '#lib/tour/tour.ts';
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
		push: await push(member.email),
		mail: await mail(member.email),
		practice: await practice(member.email),
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

/** Notifications (#157): the key the browser subscribes with, and the member's devices; null while not set up. */
async function push(email: string) {
	const keys = vapidKeys();
	if (!keys) return null;
	const devices = await getStore()
		.pushOf(email)
		.catch(() => []);
	return { publicKey: keys.publicKey, endpoints: devices.map((device) => device.endpoint) };
}

/** Reminders by email (#123): whether they're on for this member; null while no account sends mail. */
async function mail(email: string) {
	if (!(await mailReady())) return null;
	const off = await getStore()
		.mailOptOuts()
		.then((optOut) => optOut.has(email))
		.catch(() => false);
	return { off };
}

/** Practice time: whether it's on and the member's own days; only ever loaded for the signed-in member. */
async function practice(email: string) {
	const store = getStore();
	const member = normalizeEmail(email);
	try {
		const [on, days, marks] = await Promise.all([store.practiceOn(member), store.practiceOf(member), store.marksOf(member)]);
		// Notes in the parts (practice viewer): in how many parts, for deleting them all.
		return { on, days, today: today(), markedParts: new Set(marks.map((page) => page.file)).size };
	} catch (error) {
		console.error('Loading practice time failed:', error);
		return null;
	}
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

	/** Turns reminders by email off or on again; kept in the store, not the sheet. */
	mail: async ({ locals, request }) => {
		const user = locals.access.user;
		if (locals.auth === 'off' || !user) redirect(303, '/anmelden');
		const off = (await request.formData()).get('off') === 'true';
		try {
			await getStore().setMailOptOut(normalizeEmail(user.email), off);
			return { mailSaved: true };
		} catch (error) {
			console.error('Changing email reminders failed:', error);
			return fail(503, { mailMessage: t.email.profileFailed });
		}
	},

	/** Practice time on or off; turning it off keeps what was recorded until it's deleted. */
	practice: async ({ locals, request }) => {
		const user = locals.access.user;
		if (locals.auth === 'off' || !user) redirect(303, '/anmelden');
		const on = (await request.formData()).get('on') === 'true';
		try {
			await getStore().setPracticeOn(normalizeEmail(user.email), on);
			return { practiceSaved: true };
		} catch (error) {
			console.error('Changing practice time failed:', error);
			return fail(503, { practiceMessage: t.practice.failed });
		}
	},

	/** Forgets all of the member's own practice time. */
	practiceDelete: async ({ locals }) => {
		const user = locals.access.user;
		if (locals.auth === 'off' || !user) redirect(303, '/anmelden');
		try {
			await getStore().deletePractice(normalizeEmail(user.email));
			return { practiceDeleted: true };
		} catch (error) {
			console.error('Deleting practice time failed:', error);
			return fail(503, { practiceMessage: t.practice.failed });
		}
	},

	/** Forgets all of the member's own notes in the parts. */
	marksDelete: async ({ locals }) => {
		const user = locals.access.user;
		if (locals.auth === 'off' || !user) redirect(303, '/anmelden');
		try {
			await getStore().deleteMarks(normalizeEmail(user.email));
			return { marksDeleted: true };
		} catch (error) {
			console.error('Deleting notes failed:', error);
			return fail(503, { practiceMessage: t.practice.failed });
		}
	},

	/** How the tour ended (finished or skipped), so it isn't offered again; kept in the store, like the opt-out. */
	tour: async ({ locals, request }) => {
		const user = locals.access.user;
		if (locals.auth === 'off' || !user) redirect(303, '/anmelden');
		const outcome = readOutcome((await request.formData()).get('outcome'));
		if (!outcome) return fail(400, { tourSaved: false });
		try {
			await getStore().setTour(normalizeEmail(user.email), outcome);
			return { tourSaved: true };
		} catch (error) {
			console.error('Saving the tour state failed:', error);
			return fail(503, { tourSaved: false });
		}
	},

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
