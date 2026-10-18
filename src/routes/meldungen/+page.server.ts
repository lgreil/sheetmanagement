import { fail } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { SUGGESTED_STATUS } from '#lib/feedback/feedback.ts';
import { t } from '#lib/i18n/index.ts';
import type { MarkableStatus } from '#lib/music/status-word.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { formText, markReportedFile, setReportStatus } from '#lib/server/feedback.ts';
import { getFeedback } from '#lib/server/repertoire.ts';
import { driveWriteEnabled } from '#lib/server/services.ts';
import { SheetLayoutError } from '#lib/server/sheet-writes.ts';
import type { Actions, PageServerLoad } from './$types';

// Looking after the sheet music is what "stuecke.bearbeiten" is for.
const RIGHT = 'stuecke.bearbeiten';
const STATUS_WORDS = Object.keys(config.naming.status) as MarkableStatus[];

export const load: PageServerLoad = async ({ locals }) => {
	requireRight(locals, RIGHT);
	const feedback = await getFeedback();
	const driveWrite = driveWriteEnabled();
	if (!feedback?.tables.reports) return { state: 'not-set-up' as const, open: [], done: [], driveWrite, statusWords: [] };
	// Newest first.
	const reports = [...feedback.reports].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt) || b.row - a.row);
	const shown = reports.map(({ row: _, driveComment, ...report }) => ({
		...report,
		inDrive: !!driveComment,
		suggested: SUGGESTED_STATUS[report.kind]
	}));
	return {
		state: 'ready' as const,
		driveWrite,
		statusWords: STATUS_WORDS.map((status) => ({ status, word: config.naming.status[status] })),
		open: shown.filter((report) => report.status === 'open'),
		done: shown.filter((report) => report.status === 'done')
	};
};

async function run(work: () => Promise<boolean | null | undefined>) {
	try {
		const result = await work();
		if (result === undefined) return fail(404, { message: t.reports.gone });
		// Saved in the sheet; Drive refused (no editor access?) and the log has the details.
		return result === false ? { saved: true, warning: t.reports.driveFailed } : { saved: true };
	} catch (cause) {
		if (cause instanceof SheetLayoutError) return fail(409, { message: cause.message });
		console.error('Changing a problem report failed:', cause);
		return fail(503, { message: t.reports.failed });
	}
}

async function change(locals: App.Locals, request: Request, status: 'open' | 'done') {
	requireRight(locals, RIGHT);
	const data = await request.formData();
	return run(() => setReportStatus(formText(data, 'id', 40), status, formText(data, 'note', 500)));
}

export const actions: Actions = {
	close: ({ locals, request }) => change(locals, request, 'done'),
	reopen: ({ locals, request }) => change(locals, request, 'open'),
	mark: async ({ locals, request }) => {
		requireRight(locals, RIGHT);
		const data = await request.formData();
		const status = formText(data, 'status') as MarkableStatus;
		if (!STATUS_WORDS.includes(status)) return fail(400, { message: t.reports.failed });
		return run(() => markReportedFile(formText(data, 'id', 40), status));
	}
};
