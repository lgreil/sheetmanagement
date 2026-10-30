/** The store's types (#161); see index.ts. */

import type { ErrorGroup, ErrorReport } from '#lib/errors/errors.ts';
import type { Stroke } from '#lib/practice/marks.ts';
import type { PracticeDay } from '#lib/practice/practice.ts';
import type { TourOutcome } from '#lib/tour/tour.ts';

export interface PushDevice {
	/** The push service's address for this device; also its id. */
	endpoint: string;
	email: string;
	/** The device's public key and secret for encrypting messages (base64url). */
	p256dh: string;
	auth: string;
	/** When the device was signed up, "2026-10-23 08:30:00" (UTC); for the member's data export. */
	createdAt?: string;
}

export interface SentReminder {
	kind: string;
	subject: string;
	/** "2026-10-23 08:30:00" (UTC). */
	sentAt: string;
}

export type { TourOutcome } from '#lib/tour/tour.ts';
export type { PracticeDay } from '#lib/practice/practice.ts';
export type { Stroke } from '#lib/practice/marks.ts';
export type { ErrorGroup, ErrorReport } from '#lib/errors/errors.ts';

/** One page's marks in a part. */
export interface PageMarks {
	file: string;
	page: number;
	strokes: Stroke[];
}

/** A member's marks in a part, offered to the others who play it: a copy of their pages then. */
export interface MarkShare {
	id: string;
	sender: string;
	file: string;
	/** By page. */
	pages: Record<number, Stroke[]>;
	/** When it was offered, like SQLite's datetime('now'). */
	at: string;
}

/** How a member answered an offer: took all of it, some marks by hand, or none. */
export type ShareAnswer = 'all' | 'some' | 'declined';

/** What the completeness check found for one file in the archive (#93). */
export interface PartCheck {
	fileId: string;
	/** Drive's modifiedTime when it was checked; a newer one is checked again. */
	modified: string;
	/** Its pages; null when it isn't a readable PDF. */
	pages: number | null;
	/** Too big to check within the CPU limit. */
	skipped: boolean;
	/** An organiser said the hint is wrong. */
	dismissed: boolean;
}

export interface Store {
	kind: 'd1' | 'memory';
	/** The newest migration applied, e.g. "0001_reminders.sql"; null before the first. */
	schemaVersion(): Promise<string | null>;
	/** Applies the migrations not applied yet; returns their names. */
	migrate(): Promise<string[]>;

	savePush(device: PushDevice): Promise<void>;
	deletePush(endpoint: string): Promise<void>;
	/** A member's devices. */
	pushOf(email: string): Promise<PushDevice[]>;
	allPush(): Promise<PushDevice[]>;

	/** Which of these reminders already went out, as `${subject}\n${recipient}`. */
	sentReminders(kind: string, subjects: string[]): Promise<Set<string>>;
	logReminder(kind: string, subject: string, recipient: string): Promise<void>;
	/** The reminders one person got, oldest first; for their data export (#158). */
	remindersOf(recipient: string): Promise<SentReminder[]>;
	/** Forgets the reminders one person got; for "Mitglied löschen" (#158). */
	deleteRemindersOf(recipient: string): Promise<void>;
	/** Forgets reminders older than this many days. */
	pruneReminders(days: number): Promise<void>;

	/** Members who turned email reminders off (#123). */
	mailOptOuts(): Promise<Set<string>>;
	setMailOptOut(email: string, off: boolean): Promise<void>;

	/** Whether a member finished or skipped the tour; null while they haven't seen it. */
	tourOf(email: string): Promise<TourOutcome | null>;
	/** Remembers how the tour ended; null forgets it, so it's offered again. */
	setTour(email: string, outcome: TourOutcome | null): Promise<void>;

	/** Whether a member turned practice time on; off for everyone else. Only for the member themself. */
	practiceOn(email: string): Promise<boolean>;
	setPracticeOn(email: string, on: boolean): Promise<void>;
	/** Adds seconds to a member's day, up to `cap` for that day. */
	addPractice(email: string, day: string, seconds: number, cap: number): Promise<void>;
	/** A member's own days, oldest first. Never all members': there is no such method on purpose. */
	practiceOf(email: string): Promise<PracticeDay[]>;
	/** Forgets all of a member's practice time. */
	deletePractice(email: string): Promise<void>;

	/** A member's own marks in one part, or in all parts without `file`; by page. */
	marksOf(email: string, file?: string): Promise<PageMarks[]>;
	/** Replaces one page's marks; no strokes forget the page. */
	saveMarks(email: string, file: string, page: number, strokes: Stroke[]): Promise<void>;
	/** Forgets all of a member's marks, with their offers and their answers to others' offers. */
	deleteMarks(email: string): Promise<void>;

	/** Offers the member's marks in a part to their section; replaces an earlier offer of that part. */
	shareMarks(sender: string, file: string, pages: Record<number, Stroke[]>): Promise<MarkShare>;
	/** Takes the member's offer in a part back. */
	unshareMarks(sender: string, file: string): Promise<void>;
	/** One offer, answered or not. */
	shareById(id: string): Promise<MarkShare | null>;
	/** The member's own offer in a part, if they made one. */
	shareOf(sender: string, file: string): Promise<MarkShare | null>;
	/** Others' offers in a part that the member hasn't answered yet, newest first. */
	sharesFor(email: string, file: string): Promise<MarkShare[]>;
	answerShare(id: string, email: string, answer: ShareAnswer): Promise<void>;

	/** Everything the completeness check found (#93). */
	partChecks(): Promise<PartCheck[]>;
	/** Saves a check; a dismissed hint stays dismissed while the file is the same version. */
	savePartCheck(check: Omit<PartCheck, 'dismissed'>): Promise<void>;
	dismissPartCheck(fileId: string): Promise<void>;
	/** Forgets every check, so the archive is read again from the start; for the demo's reset. */
	clearPartChecks(): Promise<void>;

	/** Counts one more error of its kind (#191); a new kind starts unnotified. */
	logError(report: ErrorReport): Promise<void>;
	/** The kinds of errors seen within this many days, the latest first. */
	errorLog(days: number): Promise<ErrorGroup[]>;
	/** Remembers that the admins were told about these kinds. */
	markErrorsNotified(fingerprints: string[]): Promise<void>;
	/** Forgets kinds not seen for this many days; 0 forgets all ("erledigt" on /status). */
	pruneErrors(days: number): Promise<void>;

	/**
	 * Counts one more use of `key` in a window of this many minutes and returns the count so
	 * far, this one included; a window older than that starts again at 1. For rate limits.
	 */
	hit(key: string, windowMinutes: number): Promise<number>;

	getState(key: string): Promise<string | null>;
	setState(key: string, value: string): Promise<void>;
}

export const reminderKey = (subject: string, recipient: string) => `${subject}\n${recipient}`;
