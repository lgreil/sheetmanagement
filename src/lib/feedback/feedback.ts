import { normalizeEmail } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { safeLink } from '#lib/links.ts';
import type { MarkableStatus } from '#lib/music/status-word.ts';
import { t } from '#lib/i18n/index.ts';
import { LAYOUT, normalize, readTable, type ColumnKey, type Table } from '#lib/repertoire/sheet.ts';

/**
 * Problem reports on sheet music ("Meldungen") and wishes ("Wünsche"): rows members add
 * and people with the right set a status on. Both tabs are optional; without them the
 * features say they aren't set up yet.
 */

export const FEEDBACK_TABS = ['reports', 'wishes'] as const;
export type FeedbackTab = (typeof FEEDBACK_TABS)[number];
export type FeedbackValues = Partial<Record<FeedbackTab, string[][]>>;

const VALUES = t.feedbackValues;
export type ReportKind = keyof typeof VALUES.reportKind;
export type ReportStatus = keyof typeof VALUES.reportStatus;
export type WishKind = keyof typeof VALUES.wishKind;
export type WishStatus = keyof typeof VALUES.wishStatus;

export const REPORT_KINDS = Object.keys(VALUES.reportKind) as ReportKind[];
export const WISH_STATUSES = Object.keys(VALUES.wishStatus) as WishStatus[];

/** "Anna Beispiel <anna@example.org>" or "anna@example.org" → the email, lower case; anonymous wishes have none. */
export function submitterEmail(submittedBy: string): string | undefined {
	const email = (submittedBy.match(/<([^<>]+)>\s*$/)?.[1] ?? submittedBy).trim().toLowerCase();
	return email.includes('@') ? email : undefined;
}

/**
 * Who may delete a wish: admins any, the submitter their own while it's still open.
 * Anonymous wishes keep no name, so only admins can delete them.
 */
export function mayDeleteWish(wish: Pick<Wish, 'submittedBy' | 'status'>, email: string, admin: boolean): boolean {
	if (admin) return true;
	return wish.status === 'open' && submitterEmail(wish.submittedBy) === email.trim().toLowerCase();
}

/** Reads a dropdown cell back to its key, ignoring case and accents; unknown text gives the fallback. */
function fromLabel<K extends string>(labels: Record<K, string>, text: string, fallback: K): K {
	const wanted = normalize(text);
	if (!wanted) return fallback;
	return (Object.keys(labels) as K[]).find((key) => normalize(labels[key]) === wanted || key === wanted) ?? fallback;
}

/** A wish's status cell ("offen", "geplant" …) as its key. */
export const readWishStatus = (text: string): WishStatus => fromLabel(VALUES.wishStatus, text, 'open');

export interface Report {
	row: number;
	id: string;
	/** The piece's Drive folder id, which is also its id in the app. */
	pieceId: string;
	pieceName: string;
	/** The part's label as shown when reported; empty for the whole piece. */
	part: string;
	fileId: string;
	kind: ReportKind;
	comment: string;
	status: ReportStatus;
	note: string;
	reportedBy: string;
	reportedAt: string;
	/** The status word the app put in the file's name in Drive, to take out again when done. */
	marked?: MarkableStatus;
	/** The comment the app added to the file in Drive. */
	driveComment: string;
}

export interface Wish {
	row: number;
	id: string;
	kind: WishKind;
	title: string;
	composer: string;
	/** Only http(s) links; anything else is dropped, so a cell can't become a script link. */
	link?: string;
	description: string;
	status: WishStatus;
	answer: string;
	submittedBy: string;
	submittedAt: string;
	/** Emails of the people who gave a +1, lower case, each once. */
	votes: string[];
	/** The concert it's suggested for (its "Anlass"); empty: any time. */
	concert: string;
	/** The archive piece it's about, e.g. "Wieder spielen" (#108). */
	pieceId?: string;
}

export interface Feedback {
	reports: Report[];
	wishes: Wish[];
	tables: { [K in FeedbackTab]?: Table<ColumnKey<K> & string> };
}

/** "UNVOLLSTÄNDIG" → "incomplete", as in the naming convention. */
export function markedStatus(word: string): MarkableStatus | undefined {
	const wanted = normalize(word);
	if (!wanted) return undefined;
	const status = config.naming.status;
	return (Object.keys(status) as MarkableStatus[]).find((key) => normalize(status[key]) === wanted);
}

/** Which status word fits a kind of problem, as a suggestion when marking the file. */
export const SUGGESTED_STATUS: Record<ReportKind, MarkableStatus> = {
	missing: 'empty',
	scan: 'incomplete',
	pages: 'incomplete',
	wrong: 'incomplete',
	other: 'incomplete'
};

export { safeLink } from '#lib/links.ts';

/** "a@x.org, B@x.org, a@x.org" → ["a@x.org", "b@x.org"] */
export function parseVotes(text: string): string[] {
	return [...new Set(text.split(/[,;\s]+/).map(normalizeEmail).filter((email) => email.includes('@')))];
}

/** Adds or removes one person's +1. */
export function toggleVote(votes: string[], email: string): string[] {
	const who = normalizeEmail(email);
	return votes.includes(who) ? votes.filter((vote) => vote !== who) : [...votes, who];
}

export function buildFeedback(values: FeedbackValues): Feedback {
	const read = <K extends FeedbackTab>(key: K) =>
		values[key] ? readTable(values[key], LAYOUT[key].columns as Record<ColumnKey<K> & string, string>) : undefined;
	const tables = { reports: read('reports'), wishes: read('wishes') };

	const reports: Report[] = (tables.reports?.rows ?? [])
		.filter(({ values: v }) => v.id && v.pieceId)
		.map(({ row, values: v }) => ({
			row,
			id: v.id,
			pieceId: v.pieceId,
			pieceName: v.piece,
			part: v.part,
			fileId: v.fileId,
			kind: fromLabel(VALUES.reportKind, v.kind, 'other'),
			comment: v.comment,
			status: fromLabel(VALUES.reportStatus, v.status, 'open'),
			note: v.note,
			reportedBy: v.reportedBy,
			reportedAt: v.reportedAt,
			marked: markedStatus(v.marked),
			driveComment: v.driveComment
		}));

	const wishes: Wish[] = (tables.wishes?.rows ?? [])
		.filter(({ values: v }) => v.id && (v.title || v.description))
		.map(({ row, values: v }) => ({
			row,
			id: v.id,
			kind: fromLabel(VALUES.wishKind, v.kind, 'piece'),
			title: v.title,
			composer: v.composer,
			link: safeLink(v.link),
			description: v.description,
			status: readWishStatus(v.status),
			answer: v.answer,
			submittedBy: v.submittedBy,
			submittedAt: v.submittedAt,
			votes: parseVotes(v.votes),
			concert: v.concert ?? '',
			pieceId: v.pieceId || undefined
		}));

	return { reports, wishes, tables };
}

const STATUS_ORDER: Record<WishStatus, number> = { open: 0, planned: 0, done: 1, declined: 1 };

/** Open and planned wishes first, then by +1s, then newest first. */
export function sortWishes(wishes: Wish[]): Wish[] {
	return [...wishes].sort(
		(a, b) =>
			STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
			b.votes.length - a.votes.length ||
			b.submittedAt.localeCompare(a.submittedAt) ||
			b.row - a.row
	);
}

/** Short random id for a new row, so status changes find it even after rows move. */
export function newId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
