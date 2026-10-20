import { fail } from '@sveltejs/kit';
import { normalizeEmail, planApproval, resolveAccess, RIGHTS, splitGroups, type Right } from '#lib/access/access.ts';
import { t } from '#lib/i18n/index.ts';
import { normalize } from '#lib/repertoire/sheet.ts';
import { authConfig, requireRight } from '#lib/server/auth/index.ts';
import { config } from '#lib/config/index.ts';
import { splitNames } from '#lib/music/instrument-groups.ts';
import { formatInstrument, parseInstrument, playableInstruments } from '#lib/music/my-parts.ts';
import { getAccessList, getInstrumentGroups } from '#lib/server/repertoire.ts';
import { appendRecords, deleteRows, readTab, refreshAfterWrite, SheetLayoutError, updateRecord } from '#lib/server/sheet-writes.ts';
import { requireSetting } from '#lib/server/services.ts';
import type { Actions, PageServerLoad } from './$types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.auth === 'off') return { state: 'off' as const };
	requireRight(locals, 'mitglieder.verwalten');

	const [list, groups] = await Promise.all([getAccessList(), getInstrumentGroups()]);
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
		members:
			list?.members.map(({ email, name, instrument, groups }) => {
				const choice = parseInstrument(instrument ?? '', config);
				return {
					email,
					name,
					instrument,
					// For the edit form: the instrument as picked from the list, if the text is one.
					choice: choice ? { instrument: choice.instrument, number: choice.number ?? 0 } : null,
					groups,
					// What they may do, from their own grants and their groups'.
					rights: [...resolveAccess({ email, name }, list, auth.mode === 'on' ? auth.bootstrapAdmins : []).rights].filter(
						(right) => right !== 'ansehen'
					)
				};
			}) ?? [],
		groups: list?.groups.map(({ name, description }) => ({ name, description })) ?? [],
		grants: list?.grants.map(({ who, right }) => ({ who, right })) ?? [],
		rights: RIGHTS.map((right) => ({ right, label: t.rights[right] })),
		// The sheet's groups, or the preset's while the tab is empty.
		instrumentGroups: groups
			? { own: true, unknown: groups.unknown, rows: groups.groups.map(({ row, part, players, mutual, note }) => ({ row, part, players, mutual, note })) }
			: {
					own: false,
					unknown: [],
					rows: Object.entries(config.sharedParts ?? {}).map(([part, players]) => ({ row: 0, part, players, mutual: false, note: '' }))
				},
		instruments: config.instruments.filter((instrument) => !instrument.voice).map((instrument) => instrument.name),
		playable: playableInstruments(config)
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

/** One request ("email") or all shown at once (several "email" fields). */
const emails = (data: FormData) => data.getAll('email').map((value) => normalizeEmail(String(value).slice(0, 200))).filter(Boolean);

async function approve(list: string[]) {
	const [members, requests] = await Promise.all([readTab('members'), readTab('requests')]);
	const plan = planApproval(
		members.rows.map((row) => row.values.email),
		requests.rows.map((row) => ({ row: row.row, email: row.values.email, name: row.values.name })),
		list
	);
	if (!plan.remove.length) return t.admin.requestGone;
	if (plan.add.length) await appendRecords('members', members, plan.add);
	await deleteRows('requests', plan.remove);
}

async function decline(list: string[]) {
	const wanted = new Set(list);
	const requests = await readTab('requests');
	await deleteRows(
		'requests',
		requests.rows.filter((row) => wanted.has(normalizeEmail(row.values.email))).map((row) => row.row)
	);
}

export const actions: Actions = {
	approve: ({ request, locals }) => change(locals, async () => approve(emails(await request.formData()))),
	decline: ({ request, locals }) => change(locals, async () => decline(emails(await request.formData()))),

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

	editMember: ({ request, locals }) =>
		change(locals, async () => {
			const data = await request.formData();
			const email = normalizeEmail(field(data, 'email'));
			const instrument = field(data, 'instrument');
			if (instrument && !playableInstruments(config).includes(instrument)) return t.admin.unknownInstrument;
			const number = Number(field(data, 'number'));
			const members = await readTab('members');
			const row = members.rows.find((r) => normalizeEmail(r.values.email) === email);
			if (!row) return t.admin.memberGone;
			await updateRecord('members', members, row.row, {
				name: field(data, 'name'),
				instrument: instrument ? formatInstrument({ instrument, ...(number >= 1 && number <= 8 ? { number } : {}) }) : '',
				groups: splitGroups(field(data, 'groups')).join(', ')
			});
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
			if (rights.rows.some((row) => whoKey(row.values.who) === whoKey(who) && row.values.right.trim().toLowerCase() === right)) {
				return t.admin.grantExists;
			}
			await appendRecords('rights', rights, [{ who: who.includes('@') ? normalizeEmail(who) : who, right }]);
		}),

	addGroup: ({ request, locals }) =>
		change(locals, async () => {
			const data = await request.formData();
			const part = field(data, 'part');
			const players = splitNames(String(data.get('players') ?? '').slice(0, 500));
			if (!part || !players.length) return t.admin.groupMissing;
			const table = await readTab('instrumentGroups');
			// The first own row replaces the presets, so they're copied in first and stay in effect.
			const defaults = table.rows.length
				? []
				: Object.entries(config.sharedParts ?? {}).map(([name, list]) => ({ part: name, players: list.join(', ') }));
			await appendRecords('instrumentGroups', table, [
				...defaults,
				{ part, players: players.join(', '), mutual: data.get('mutual') === 'on' ? 'TRUE' : 'FALSE', note: field(data, 'note') }
			]);
		}),

	removeGroup: ({ request, locals }) =>
		change(locals, async () => {
			const data = await request.formData();
			const row = Number(data.get('row'));
			const table = await readTab('instrumentGroups');
			// The row number plus the part name, so a row that moved in the meantime isn't deleted by mistake.
			const target = table.rows.find((r) => r.row === row && normalize(r.values.part) === normalize(field(data, 'part')));
			if (!target) return t.admin.groupGone;
			await deleteRows('instrumentGroups', [target.row]);
		}),

	revoke: ({ request, locals }) =>
		change(locals, async () => {
			const data = await request.formData();
			const who = whoKey(field(data, 'who'));
			const right = field(data, 'right').toLowerCase();
			const rights = await readTab('rights');
			await deleteRows(
				'rights',
				rights.rows.filter((row) => whoKey(row.values.who) === who && row.values.right.trim().toLowerCase() === right).map((row) => row.row)
			);
		})
};
