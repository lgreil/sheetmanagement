import type { User } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { newId, parseVotes, toggleVote, type ReportKind, type ReportStatus, type WishKind, type WishStatus } from '#lib/feedback/feedback.ts';
import { t } from '#lib/i18n/index.ts';
import { eventDay } from '#lib/repertoire/dates.ts';
import { appendRecords, readTab, refreshAfterWrite, updateRecord } from './sheet-writes.ts';

/**
 * Writes for problem reports and wishes. Like the programme editor, every change starts
 * from a fresh read of the tab, and rows are found by their id, not their row number.
 * Values are written as typed (RAW), so a name or comment starting with "=" stays text.
 */

/** Reporting and wishing need someone signed in: their +1 counts once and admins can ask back. */
export function feedbackUser(locals: App.Locals): User | null {
	return locals.auth === 'on' && locals.access.member && locals.access.rights.has('ansehen') ? locals.access.user : null;
}

/** "Anna Beispiel <anna@example.org>", shown to admins only. */
const who = (user: User) => (user.name && user.name !== user.email ? `${user.name} <${user.email}>` : user.email);
const today = () => eventDay({ start: new Date().toISOString(), allDay: false }, config.timeZone);

export async function addReport(
	user: User,
	report: { pieceId: string; pieceName: string; part: string; fileId: string; kind: ReportKind; comment: string }
): Promise<void> {
	const table = await readTab('reports');
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
			id: newId()
		}
	]);
	await refreshAfterWrite();
}

/** False when the report no longer exists. */
export async function setReportStatus(id: string, status: ReportStatus, note: string): Promise<boolean> {
	const table = await readTab('reports');
	const row = table.rows.find((r) => r.values.id === id);
	if (!row) return false;
	await updateRecord('reports', table, row.row, { status: t.feedbackValues.reportStatus[status], note });
	await refreshAfterWrite();
	return true;
}

export async function addWish(
	user: User,
	wish: { kind: WishKind; title: string; composer: string; link: string; description: string }
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
			submittedBy: who(user),
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

/** A form field, trimmed and cut to a sane length. */
export const formText = (data: FormData, name: string, max = 200) => String(data.get(name) ?? '').trim().slice(0, max);
