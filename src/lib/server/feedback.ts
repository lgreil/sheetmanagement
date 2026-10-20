import type { User } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { markedStatus, mayDeleteWish, newId, parseVotes, readWishStatus, toggleVote, type ReportKind, type ReportStatus, type WishKind, type WishStatus } from '#lib/feedback/feedback.ts';
import { t } from '#lib/i18n/index.ts';
import { withoutStatusWord, withStatusWord, type MarkableStatus } from '#lib/music/status-word.ts';
import { eventDay } from '#lib/repertoire/dates.ts';
import { runInBackground } from './env.ts';
import { createComment, createGoogleDoc, getFile, renameFile, replyToComment } from './google/drive.ts';
import { driveWriteEnabled, getArchiveIndex, getGoogle } from './services.ts';
import { appendRecords, deleteRows, readTab, refreshAfterWrite, updateRecord } from './sheet-writes.ts';

/**
 * Writes for problem reports and wishes. Like the programme editor, every change starts
 * from a fresh read of the tab, and rows are found by their id, not their row number.
 * Values are written as typed (RAW), so a name or comment starting with "=" stays text.
 *
 * With DRIVE_WRITE=true, reports are mirrored into Drive: a comment on the reported file
 * (without the reporter's name), resolved when the report is done, and on request the
 * convention's status word in the file name. Drive failing never loses the report.
 */

/** Runs a Drive change; false (and a log line) if Drive refuses, e.g. without editor access. */
async function inDrive(what: string, work: () => Promise<unknown>): Promise<boolean> {
	try {
		await work();
		return true;
	} catch (error) {
		console.error(`${what} in Drive failed:`, error);
		return false;
	}
}

/** Re-reads the archive after a rename, so the new status shows up without waiting. */
function refreshArchive() {
	runInBackground(getArchiveIndex({ force: true }).catch((error) => console.error('Refreshing the archive failed:', error)));
}

/** Reporting and wishing need someone signed in: their +1 counts once and admins can ask back. */
export function feedbackUser(locals: App.Locals): User | null {
	return locals.auth === 'on' && locals.access.member && locals.access.rights.has('ansehen') ? locals.access.user : null;
}

/** "Anna Beispiel <anna@example.org>", shown to admins only. */
const who = (user: User) => (user.name && user.name !== user.email ? `${user.name} <${user.email}>` : user.email);
const today = () => eventDay({ start: new Date().toISOString(), allDay: false }, config.timeZone);

/** Whether Drive was updated too: null when there was nothing to do there. */
export type DriveResult = boolean | null;

export async function addReport(
	user: User,
	report: { pieceId: string; pieceName: string; part: string; fileId: string; kind: ReportKind; comment: string }
): Promise<DriveResult> {
	const table = await readTab('reports');
	let driveComment = '';
	let drive: DriveResult = null;
	if (driveWriteEnabled() && report.fileId) {
		const content = t.reports.driveComment(t.feedbackValues.reportKind[report.kind], report.comment);
		drive = await inDrive('Commenting on a reported file', async () => {
			driveComment = await createComment(getGoogle().client, report.fileId, content);
		});
	}
	// An older tab without the column just doesn't remember the comment.
	if (table.missing.includes('driveComment')) driveComment = '';
	await appendRecords('reports', table, [
		{
			piece: report.pieceName,
			pieceId: report.pieceId,
			part: report.part,
			fileId: report.fileId,
			kind: t.feedbackValues.reportKind[report.kind],
			comment: report.comment,
			status: t.feedbackValues.reportStatus.open,
			reportedBy: who(user),
			reportedAt: today(),
			driveComment,
			id: newId()
		}
	]);
	await refreshAfterWrite();
	return drive;
}

/**
 * Closes or reopens a report. In Drive, the comment follows, and closing takes the
 * status word the app added out of the file name again. Undefined when the report is gone.
 */
export async function setReportStatus(id: string, status: ReportStatus, note: string): Promise<DriveResult | undefined> {
	const table = await readTab('reports');
	const row = table.rows.find((r) => r.values.id === id);
	if (!row) return undefined;
	const { fileId, driveComment, marked: markedWord } = row.values;
	const marked = markedStatus(markedWord);
	const changes: { status: string; note: string; marked?: string } = { status: t.feedbackValues.reportStatus[status], note };

	let drive: DriveResult = null;
	if (driveWriteEnabled() && fileId) {
		const { client } = getGoogle();
		const steps: Promise<boolean>[] = [];
		if (driveComment) {
			const action = status === 'done' ? 'resolve' : 'reopen';
			const content = note || (status === 'done' ? t.reports.driveResolved : t.reports.driveReopened);
			steps.push(inDrive('Updating a report comment', () => replyToComment(client, fileId, driveComment, action, content)));
		}
		if (status === 'done' && marked) {
			steps.push(
				inDrive('Removing a status word', async () => {
					const file = await getFile(client, fileId);
					const name = withoutStatusWord(file.name, marked, config.naming);
					if (name !== file.name) await renameFile(client, fileId, name);
					changes.marked = '';
				})
			);
		}
		if (steps.length) drive = (await Promise.all(steps)).every(Boolean);
		if (changes.marked === '') refreshArchive();
	}
	await updateRecord('reports', table, row.row, changes);
	await refreshAfterWrite();
	return drive;
}

/** Puts the convention's status word in the reported file's name. Undefined when the report is gone. */
export async function markReportedFile(id: string, status: MarkableStatus): Promise<boolean | undefined> {
	const table = await readTab('reports');
	const row = table.rows.find((r) => r.values.id === id);
	if (!row) return undefined;
	const { fileId } = row.values;
	if (!fileId || !driveWriteEnabled()) return false;
	const { client } = getGoogle();
	const ok = await inDrive('Marking a reported file', async () => {
		const file = await getFile(client, fileId);
		const name = withStatusWord(file.name, status, config.naming);
		if (name !== file.name) await renameFile(client, fileId, name);
	});
	if (!ok) return false;
	await updateRecord('reports', table, row.row, { marked: config.naming.status[status] });
	refreshArchive();
	await refreshAfterWrite();
	return true;
}

/**
 * After someone with the right confirmed a reported missing part: creates the convention's
 * placeholder (a Google Doc "<Kurztitel> - <Stimme> - FEHLT") in the piece folder and
 * closes the report. False when Drive refused (or DRIVE_WRITE is off): nothing changed,
 * and the placeholder can be made by hand. Undefined when the report is gone.
 */
export async function confirmMissingPart(id: string, placeholder: { name: string; folderId: string }): Promise<boolean | undefined> {
	const table = await readTab('reports');
	const row = table.rows.find((r) => r.values.id === id);
	if (!row) return undefined;
	if (!driveWriteEnabled()) return false;
	const created = await inDrive('Creating a missing-part placeholder', () => createGoogleDoc(getGoogle().client, placeholder.name, placeholder.folderId));
	if (!created) return false;
	await updateRecord('reports', table, row.row, {
		status: t.feedbackValues.reportStatus.done,
		note: t.reports.placeholderCreated(placeholder.name)
	});
	refreshArchive();
	await refreshAfterWrite();
	return true;
}

/** An anonymous wish keeps no name or email in the sheet; its +1s still count per person. */
export async function addWish(
	user: User,
	wish: { kind: WishKind; title: string; composer: string; link: string; description: string },
	{ anonymous = false } = {}
): Promise<void> {
	const table = await readTab('wishes');
	await appendRecords('wishes', table, [
		{
			kind: t.feedbackValues.wishKind[wish.kind],
			title: wish.title,
			composer: wish.composer,
			link: wish.link,
			description: wish.description,
			status: t.feedbackValues.wishStatus.open,
			submittedBy: anonymous ? '' : who(user),
			submittedAt: today(),
			id: newId()
		}
	]);
	await refreshAfterWrite();
}

/** Gives or takes back the user's +1. False when the wish no longer exists. */
export async function voteOnWish(id: string, user: User): Promise<boolean> {
	const table = await readTab('wishes');
	const row = table.rows.find((r) => r.values.id === id);
	if (!row) return false;
	const votes = toggleVote(parseVotes(row.values.votes), user.email);
	await updateRecord('wishes', table, row.row, { votes: votes.join(', ') });
	await refreshAfterWrite();
	return true;
}

export async function setWishStatus(id: string, status: WishStatus, answer: string): Promise<boolean> {
	const table = await readTab('wishes');
	const row = table.rows.find((r) => r.values.id === id);
	if (!row) return false;
	await updateRecord('wishes', table, row.row, { status: t.feedbackValues.wishStatus[status], answer });
	await refreshAfterWrite();
	return true;
}

/** Deletes a wish's row if the user may (see mayDeleteWish). False when it's gone, "forbidden" otherwise. */
export async function deleteWish(id: string, user: User, admin: boolean): Promise<boolean | 'forbidden'> {
	const table = await readTab('wishes');
	const row = table.rows.find((r) => r.values.id === id);
	if (!row) return false;
	const wish = { submittedBy: row.values.submittedBy, status: readWishStatus(row.values.status) };
	if (!mayDeleteWish(wish, user.email, admin)) return 'forbidden';
	await deleteRows('wishes', [row.row]);
	await refreshAfterWrite();
	return true;
}

/** A form field, trimmed and cut to a sane length. */
export const formText = (data: FormData, name: string, max = 200) => String(data.get(name) ?? '').trim().slice(0, max);
