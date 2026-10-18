import { fail } from '@sveltejs/kit';
import { t } from '#lib/i18n/index.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { formText, setReportStatus } from '#lib/server/feedback.ts';
import { getFeedback } from '#lib/server/repertoire.ts';
import { SheetLayoutError } from '#lib/server/sheet-writes.ts';
import type { Actions, PageServerLoad } from './$types';

// Looking after the sheet music is what "stuecke.bearbeiten" is for.
const RIGHT = 'stuecke.bearbeiten';

export const load: PageServerLoad = async ({ locals }) => {
	requireRight(locals, RIGHT);
	const feedback = await getFeedback();
	if (!feedback?.tables.reports) return { state: 'not-set-up' as const, open: [], done: [] };
	// Newest first.
	const reports = [...feedback.reports].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt) || b.row - a.row);
	const shown = reports.map(({ row: _, ...report }) => report);
	return {
		state: 'ready' as const,
		open: shown.filter((report) => report.status === 'open'),
		done: shown.filter((report) => report.status === 'done')
	};
};

async function change(locals: App.Locals, request: Request, status: 'open' | 'done') {
	requireRight(locals, RIGHT);
	const data = await request.formData();
	try {
		const found = await setReportStatus(formText(data, 'id', 40), status, formText(data, 'note', 500));
		return found ? { saved: true } : fail(404, { message: t.reports.gone });
	} catch (cause) {
		if (cause instanceof SheetLayoutError) return fail(409, { message: cause.message });
		console.error('Changing a problem report failed:', cause);
		return fail(503, { message: t.reports.failed });
	}
}

export const actions: Actions = {
	close: ({ locals, request }) => change(locals, request, 'done'),
	reopen: ({ locals, request }) => change(locals, request, 'open')
};
