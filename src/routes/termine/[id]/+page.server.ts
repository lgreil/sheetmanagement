import { error, fail, redirect } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { bestOption, calendarLink, canSeePoll, choicesFromForm, isOpen, scoreOptions, type Poll } from '#lib/polls/polls.ts';
import { today } from '#lib/server/members.ts';
import { pollStore, pollViewer, type PollViewer } from '#lib/server/polls.ts';
import { getAccessList } from '#lib/server/repertoire.ts';
import type { Actions, PageServerLoad } from './$types';

/** The poll and who's looking, or the reason they can't. */
async function open(locals: App.Locals, id: string) {
	const store = pollStore();
	const viewer = await pollViewer(locals);
	if (!viewer) error(401, t.messages.signInFirst);
	if (!store) error(404, t.polls.notSetUp);
	const found = await store.get(id);
	// Not found and not meant for you look the same: a poll's title says nothing to others.
	if (!found || !canSeePoll(found.poll, viewer)) error(404, t.polls.noAccess);
	return { store, viewer, ...found };
}

const mayManage = (poll: Poll, viewer: PollViewer) => viewer.plans || poll.createdBy === viewer.email;

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const { viewer, poll, responses } = await open(locals, params.id);
	const scores = scoreOptions(poll, responses);
	const best = bestOption(poll, responses);
	const chosen = poll.options.find((option) => option.id === poll.chosen);
	// Who the poll is for but hasn't answered yet: worth a nudge in the group chat.
	const access = await getAccessList().catch(() => null);
	const wanted = new Set(poll.groups.map((group) => group.toLowerCase()));
	const answered = new Set(responses.map((response) => response.email));
	const waiting = (access?.members ?? [])
		.filter((member) => member.status !== 'inaktiv' && member.groups.some((group) => wanted.has(group.toLowerCase())) && !answered.has(member.email))
		.map((member) => member.name);
	return {
		poll,
		responses,
		mine: responses.find((response) => response.email === viewer.email) ?? null,
		scores: scores.map(({ option, yes, maybe, no }) => ({ id: option.id, yes, maybe, no })),
		best: best?.id,
		open: isOpen(poll, today()),
		manage: mayManage(poll, viewer),
		waiting,
		saved: url.searchParams.has('gespeichert'),
		calendarUrl: chosen ? calendarLink(poll.title, chosen, config.timeZone, poll.note) : undefined
	};
};

export const actions: Actions = {
	answer: async ({ locals, params, request }) => {
		const { store, viewer, poll } = await open(locals, params.id);
		if (!isOpen(poll, today())) return fail(409, { error: t.polls.closed });
		const { choices, comment } = choicesFromForm(poll, await request.formData());
		try {
			await store.respond(poll.id, { email: viewer.email, name: viewer.name, choices, comment, updatedAt: new Date().toISOString() });
		} catch (cause) {
			console.error('Saving a poll answer failed:', cause);
			return fail(503, { error: t.polls.failed });
		}
		redirect(303, `/termine/${poll.id}?gespeichert`);
	},

	close: async ({ locals, params, request }) => {
		const { store, viewer, poll } = await open(locals, params.id);
		if (!mayManage(poll, viewer)) error(403, t.messages.noRight);
		const option = String((await request.formData()).get('option') ?? '');
		await store.close(poll.id, poll.options.some((other) => other.id === option) ? option : undefined);
		return { closed: true };
	},

	reopen: async ({ locals, params }) => {
		const { store, viewer, poll } = await open(locals, params.id);
		if (!mayManage(poll, viewer)) error(403, t.messages.noRight);
		await store.reopen(poll.id);
		return { reopened: true };
	},

	remove: async ({ locals, params }) => {
		const { store, viewer, poll } = await open(locals, params.id);
		if (!mayManage(poll, viewer)) error(403, t.messages.noRight);
		await store.remove(poll.id);
		redirect(303, '/termine');
	}
};
