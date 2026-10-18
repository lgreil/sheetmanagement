import { fail } from '@sveltejs/kit';
import { normalizeEmail, RIGHTS, splitGroups, type Right } from '#lib/access/access.ts';
import { t } from '#lib/i18n/index.ts';
import { normalize } from '#lib/repertoire/sheet.ts';
import { authConfig, requireRight } from '#lib/server/auth/index.ts';
import { getAccessList } from '#lib/server/repertoire.ts';
import { appendRecords, deleteRows, readTab, refreshAfterWrite, SheetLayoutError } from '#lib/server/sheet-writes.ts';
import { requireSetting } from '#lib/server/services.ts';
import type { Actions, PageServerLoad } from './$types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.auth === 'off') return { state: 'off' as const };
	requireRight(locals, 'mitglieder.verwalten');

	const list = await getAccessList();
	const auth = authConfig();
	let sheetUrl: string | undefined;
	try {
		sheetUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(requireSetting('REPERTOIRE_SHEET_ID'))}/edit`;
	} catch {
		// Not configured: no link.
	}
	const ready = !!(list?.tables.members && list.tables.rights && list.tables.requests);
	return {
		state: ready ? ('ready' as const) : ('not-set-up' as const),
		sheetUrl,
		bootstrapAdmins: auth.mode === 'on' ? auth.bootstrapAdmins : [],
		requests: list?.requests.map(({ email, name, requestedAt }) => ({ email, name, requestedAt })) ?? [],
		members: list?.members.map(({ email, name, instrument, groups }) => ({ email, name, instrument, groups })) ?? [],
		groups: list?.groups.map(({ name, description }) => ({ name, description })) ?? [],
		grants: list?.grants.map(({ who, right }) => ({ who, right })) ?? [],
		rights: RIGHTS.map((right) => ({ right, label: t.rights[right] }))
	};
};

/** Runs one change; layout problems in the sheet become a message instead of a crash. */
async function change(locals: App.Locals, work: () => Promise<string | void>) {
	requireRight(locals, 'mitglieder.verwalten');
	try {
		const problem = await work();
		if (problem) return fail(400, { message: problem });
		await refreshAfterWrite();
		return { saved: true };
	} catch (error) {
		if (error instanceof SheetLayoutError) {
			return fail(409, { message: `${error.message} Bitte „${t.status.setupSheet}“ ausführen.` });
		}
		console.error('Changing members or rights failed:', error);
		return fail(503, { message: 'Die Tabelle konnte gerade nicht geändert werden. Bitte versuch es noch einmal.' });
	}
}

const field = (data: FormData, name: string) => String(data.get(name) ?? '').trim().slice(0, 200);

/** Rights apply to an email address or a group name. */
const whoKey = (who: string) => (who.includes('@') ? normalizeEmail(who) : normalize(who));

export const actions: Actions = {
	approve: ({ request, locals }) =>
		change(locals, async () => {
			const email = normalizeEmail(field(await request.formData(), 'email'));
			const [members, requests] = await Promise.all([readTab('members'), readTab('requests')]);
			const asked = requests.rows.filter((row) => normalizeEmail(row.values.email) === email);
			if (!asked.length) return 'Diese Anfrage gibt es nicht mehr.';
			if (!members.rows.some((row) => normalizeEmail(row.values.email) === email)) {
				await appendRecords('members', members, [{ email, name: asked[0].values.name }]);
			}
			await deleteRows('requests', asked.map((row) => row.row));
		}),

	decline: ({ request, locals }) =>
		change(locals, async () => {
			const email = normalizeEmail(field(await request.formData(), 'email'));
			const requests = await readTab('requests');
			await deleteRows(
				'requests',
				requests.rows.filter((row) => normalizeEmail(row.values.email) === email).map((row) => row.row)
			);
		}),

	addMember: ({ request, locals }) =>
		change(locals, async () => {
			const data = await request.formData();
			const email = normalizeEmail(field(data, 'email'));
			if (!EMAIL.test(email)) return t.admin.invalidEmail;
			const members = await readTab('members');
			if (members.rows.some((row) => normalizeEmail(row.values.email) === email)) return t.admin.exists;
			await appendRecords('members', members, [
				{
					email,
					name: field(data, 'name'),
					instrument: field(data, 'instrument'),
					groups: splitGroups(field(data, 'groups')).join(', ')
				}
			]);
		}),

	removeMember: ({ request, locals }) =>
		change(locals, async () => {
			const email = normalizeEmail(field(await request.formData(), 'email'));
			const members = await readTab('members');
			await deleteRows(
				'members',
				members.rows.filter((row) => normalizeEmail(row.values.email) === email).map((row) => row.row)
			);
		}),

	grant: ({ request, locals }) =>
		change(locals, async () => {
			const data = await request.formData();
			const who = field(data, 'who');
			const right = field(data, 'right') as Right;
			if (!who || !RIGHTS.includes(right)) return 'Bitte „Wer“ und ein Recht angeben.';
			if (who.includes('@') && !EMAIL.test(who)) return t.admin.invalidEmail;
			const rights = await readTab('rights');
			if (rights.rows.some((row) => whoKey(row.values.who) === whoKey(who) && row.values.right.trim() === right)) {
				return t.admin.grantExists;
			}
			await appendRecords('rights', rights, [{ who: who.includes('@') ? normalizeEmail(who) : who, right }]);
		}),

	revoke: ({ request, locals }) =>
		change(locals, async () => {
			const data = await request.formData();
			const who = whoKey(field(data, 'who'));
			const right = field(data, 'right');
			const rights = await readTab('rights');
			await deleteRows(
				'rights',
				rights.rows.filter((row) => whoKey(row.values.who) === who && row.values.right.trim() === right).map((row) => row.row)
			);
		})
};
