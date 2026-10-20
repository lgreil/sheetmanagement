import { fail } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { SUGGESTED_STATUS } from '#lib/feedback/feedback.ts';
import { t } from '#lib/i18n/index.ts';
import type { MarkableStatus } from '#lib/music/status-word.ts';
import { requireRight } from '#lib/server/auth/index.ts';
import { placeholderName } from '#lib/music/naming.ts';
import { folderUrl } from '#lib/server/catalog.ts';
import { confirmMissingPart, formText, markReportedFile, setReportStatus } from '#lib/server/feedback.ts';
import { getLibrary } from '#lib/server/library.ts';
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
	const library = await getLibrary();
	const shown = reports.map(({ row: _, driveComment, ...report }) => ({
		...report,
		inDrive: !!driveComment,
		suggested: SUGGESTED_STATUS[report.kind],
		// A part reported as missing, not yet in Drive: the placeholder it would get.
		placeholder: report.kind === 'missing' && report.part && !report.fileId ? placeholderFor(library, report.pieceId, report.part) : undefined
	}));
	return {
		state: 'ready' as const,
		driveWrite,
		statusWords: STATUS_WORDS.map((status) => ({ status, word: config.naming.status[status] })),
		open: shown.filter((report) => report.status === 'open'),
		done: shown.filter((report) => report.status === 'done')
	};
};

/** Name and folder of the placeholder for a missing part, per the naming convention. */
function placeholderFor(library: Awaited<ReturnType<typeof getLibrary>>, pieceId: string, part: string) {
	const detail = library.piecesById.get(pieceId)?.detail;
	if (!detail) return undefined;
	const files = detail.parts.filter((p) => p.section === '').map(({ id, fileName, mimeType }) => ({ id, name: fileName, mimeType }));
	return {
		name: placeholderName(files, detail.title, part, config.naming, detail),
		folderId: detail.id,
		folderUrl: folderUrl(detail.id),
		// Someone made it already, e.g. by hand: then there's nothing to create.
		exists: detail.parts.some((p) => p.status === 'missing' && p.label === part)
	};
}

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
	confirmMissing: async ({ locals, request }) => {
		requireRight(locals, RIGHT);
		const data = await request.formData();
		const id = formText(data, 'id', 40);
		const report = (await getFeedback())?.reports.find((r) => r.id === id);
		if (!report || report.kind !== 'missing' || !report.part || report.fileId) return fail(404, { message: t.reports.gone });
		// Worked out here, not taken from the form, so only the convention's name is ever created.
		const placeholder = placeholderFor(await getLibrary(), report.pieceId, report.part);
		if (!placeholder) return fail(404, { message: t.reports.gone });
		try {
			const created = await confirmMissingPart(id, placeholder);
			if (created === undefined) return fail(404, { message: t.reports.gone });
			if (!created) return { saved: false, manual: { id, name: placeholder.name, folderUrl: placeholder.folderUrl } };
			return { saved: true };
		} catch (cause) {
			if (cause instanceof SheetLayoutError) return fail(409, { message: cause.message });
			console.error('Confirming a missing part failed:', cause);
			return fail(503, { message: t.reports.failed });
		}
	},

	mark: async ({ locals, request }) => {
		requireRight(locals, RIGHT);
		const data = await request.formData();
		const status = formText(data, 'status') as MarkableStatus;
		if (!STATUS_WORDS.includes(status)) return fail(400, { message: t.reports.failed });
		return run(() => markReportedFile(formText(data, 'id', 40), status));
	}
};
