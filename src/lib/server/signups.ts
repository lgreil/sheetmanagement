import { normalizeEmail, type User } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { eventDay } from '#lib/repertoire/dates.ts';
import type { Answer } from '#lib/signups/signups.ts';
import { appendRecords, deleteRows, readTab, refreshAfterWrite, updateRecord, withSheetLock } from './sheet-writes.ts';

/**
 * Writes for sign-ups. One row per person and event: answering again changes that row,
 * found on a fresh read by event id and email. "Termin" and "Name" are only there to keep
 * the sheet readable; the app goes by the ids.
 */

const today = () => eventDay({ start: new Date().toISOString(), allDay: false }, config.timeZone);

export async function saveSignup(
	event: { id: string; label: string },
	user: User,
	values: { answer: Answer; instrument?: string; comment?: string }
): Promise<void> {
	// Read and write in one turn: two answers in the same second each find the other's row.
	await withSheetLock(async () => {
		const table = await readTab('signups');
		const email = normalizeEmail(user.email);
		const rows = table.rows.filter((row) => row.values.eventId === event.id && normalizeEmail(row.values.who) === email);
		const record = {
			event: event.label,
			who: email,
			name: user.name,
			answer: t.signups.answerValues[values.answer],
			...(values.instrument !== undefined ? { instrument: values.instrument } : {}),
			...(values.comment !== undefined ? { comment: values.comment } : {}),
			answeredAt: today(),
			eventId: event.id
		};
		if (rows.length) {
			await updateRecord('signups', table, rows[rows.length - 1].row, record);
			// Rows entered twice by hand: the newest wins, the rest go.
			await deleteRows('signups', table, rows.slice(0, -1).map((row) => row.row));
		} else {
			await appendRecords('signups', table, [record]);
		}
	});
	await refreshAfterWrite();
}

/** Takes the answer back: the person shows as "offen" again. */
export async function withdrawSignup(eventId: string, user: User): Promise<void> {
	await withSheetLock(async () => {
		const table = await readTab('signups');
		const email = normalizeEmail(user.email);
		await deleteRows(
			'signups',
			table,
			table.rows.filter((row) => row.values.eventId === eventId && normalizeEmail(row.values.who) === email).map((row) => row.row)
		);
	});
	await refreshAfterWrite();
}
