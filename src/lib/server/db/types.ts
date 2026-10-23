/** The store's types (#161); see index.ts. */

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
	/** Forgets reminders older than this many days. */
	pruneReminders(days: number): Promise<void>;

	getState(key: string): Promise<string | null>;
	setState(key: string, value: string): Promise<void>;
}

export const reminderKey = (subject: string, recipient: string) => `${subject}\n${recipient}`;
