import { fail } from '@sveltejs/kit';
import { safeLink, sortWishes, WISH_STATUSES, type WishKind, type WishStatus } from '#lib/feedback/feedback.ts';
import { t } from '#lib/i18n/index.ts';
import { searchText } from '#lib/music/text.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { addWish, feedbackUser, formText, setWishStatus, voteOnWish } from '#lib/server/feedback.ts';
import { getLibrary } from '#lib/server/library.ts';
import { getFeedback } from '#lib/server/repertoire.ts';
import { SheetLayoutError } from '#lib/server/sheet-writes.ts';
import type { Actions, PageServerLoad } from './$types';

/** Setting a wish's status and answering it is for admins. */
const MANAGE = 'mitglieder.verwalten';

export const load: PageServerLoad = async ({ locals }) => {
	const user = feedbackUser(locals);
	if (!user) return { state: 'sign-in' as const, wishes: [], canManage: false };
	const [feedback, library] = await Promise.all([getFeedback(), getLibrary()]);
	if (!feedback?.tables.wishes) return { state: 'not-set-up' as const, wishes: [], canManage: false };

	const canManage = locals.access.rights.has(MANAGE);
	const me = user.email.toLowerCase();
	// A piece request that came true links to the piece, matched by title.
	const pieceByTitle = new Map(library.pieces.map((piece) => [searchText(piece.title), piece.id]));
	return {
		state: 'ready' as const,
		canManage,
		wishes: sortWishes(feedback.wishes).map((wish) => ({
			id: wish.id,
			kind: wish.kind,
			title: wish.title,
			composer: wish.composer,
			link: wish.link,
			description: wish.description,
			status: wish.status,
			answer: wish.answer,
			submittedAt: wish.submittedAt,
			// Who asked is for admins; everyone else sees only how many agree.
			submittedBy: canManage ? wish.submittedBy : undefined,
			votes: wish.votes.length,
			voted: wish.votes.includes(me),
			pieceId: wish.kind === 'piece' && wish.title ? pieceByTitle.get(searchText(wish.title)) : undefined
		}))
	};
};

/** Runs one change; a missing tab or a failed write becomes a message. */
async function save(work: () => Promise<boolean | void>) {
	try {
		if ((await work()) === false) return fail(404, { message: t.wishes.gone });
		return { saved: true };
	} catch (cause) {
		if (cause instanceof SheetLayoutError) return fail(409, { message: t.wishes.notSetUp });
		console.error('Saving a wish failed:', cause);
		return fail(503, { message: t.wishes.failed });
	}
}

export const actions: Actions = {
	add: async ({ request, locals }) => {
		const user = feedbackUser(locals);
		if (!user) return fail(403, { message: t.wishes.signInNeeded });
		const data = await request.formData();
		const kind: WishKind = formText(data, 'kind') === 'feature' ? 'feature' : 'piece';
		const title = formText(data, 'title');
		const description = formText(data, 'description', 2000);
		const rawLink = formText(data, 'link', 500);
		const link = rawLink ? safeLink(rawLink) : '';
		if (link === undefined) return fail(400, { message: t.wishes.invalidLink, kind });
		if (kind === 'piece' && !title) return fail(400, { message: t.wishes.titleMissing, kind });
		if (kind === 'feature' && !description) return fail(400, { message: t.wishes.descriptionMissing, kind });
		const result = await save(() =>
			addWish(user, {
				kind,
				// A feature request's title is the start of its description, so the sheet stays readable.
				title: kind === 'piece' ? title : title || description.split('\n')[0].slice(0, 80),
				composer: kind === 'piece' ? formText(data, 'composer') : '',
				link,
				description
			})
		);
		return 'status' in result ? result : { added: true, kind };
	},

	vote: async ({ request, locals }) => {
		const user = feedbackUser(locals);
		if (!user) return fail(403, { message: t.wishes.signInNeeded });
		const id = formText(await request.formData(), 'id', 40);
		return save(() => voteOnWish(id, user));
	},

	status: async ({ request, locals }) => {
		requireRight(locals, MANAGE);
		const data = await request.formData();
		const status = formText(data, 'status') as WishStatus;
		if (!WISH_STATUSES.includes(status)) return fail(400, { message: t.wishes.failed });
		return save(() => setWishStatus(formText(data, 'id', 40), status, formText(data, 'answer', 1000)));
	}
};
