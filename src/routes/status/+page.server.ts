import type { PageServerLoad } from './$types';
import { GoogleApiError } from '#lib/server/google/client.ts';
import { listEvents } from '#lib/server/google/calendar.ts';
import { getSpreadsheetInfo } from '#lib/server/google/sheets.ts';
import { getArchiveIndex, getGoogle, NotConfiguredError, requireSetting } from '#lib/server/services.ts';

/** Manual refreshes are ignored when the index is younger than this, to protect API and KV quotas. */
const MIN_REFRESH_AGE_MS = 60 * 1000;

export type CheckState = 'ok' | 'error' | 'missing';

export interface Check {
	state: CheckState;
	/** Short facts shown when the check passed. */
	details: string[];
	/** What went wrong, in plain words. */
	problem?: string;
	/** What to do about it. */
	hint?: string;
}

function describeError(error: unknown, what: string, serviceAccountEmail?: string): Check {
	if (error instanceof NotConfiguredError) {
		return { state: 'missing', details: [], problem: `${error.variable} ist nicht gesetzt.` };
	}
	if (error instanceof GoogleApiError && (error.status === 403 || error.status === 404)) {
		return {
			state: 'error',
			details: [],
			problem: `Kein Zugriff auf ${what} (${error.status}).`,
			hint: serviceAccountEmail
				? `Prüfe die ID und teile ${what} mit ${serviceAccountEmail} (Lesezugriff reicht).`
				: 'Prüfe die ID und die Freigabe.'
		};
	}
	return { state: 'error', details: [], problem: error instanceof Error ? error.message : String(error) };
}

const dateTime = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' });
const dateOnly = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'UTC' });

export const load: PageServerLoad = async ({ url }) => {
	let serviceAccountEmail: string | undefined;
	const account: Check = await (async () => {
		try {
			const { client, serviceAccountEmail: email } = getGoogle();
			serviceAccountEmail = email;
			// A cheap call that proves the key works: the token request itself.
			await client.request('https://www.googleapis.com/drive/v3/about', { params: { fields: 'user(emailAddress)' } });
			return { state: 'ok', details: [`Dienstkonto: ${email}`] } satisfies Check;
		} catch (error) {
			const check = describeError(error, 'das Google-Konto', serviceAccountEmail);
			if (check.state === 'error') {
				check.hint = 'Prüfe, ob der Schlüssel vollständig eingefügt ist und das Dienstkonto noch existiert. Notfalls einen neuen Schlüssel erstellen.';
			}
			return check;
		}
	})();

	const googleReady = account.state === 'ok';
	const skipped: Check = { state: 'missing', details: [], problem: 'Erst das Dienstkonto einrichten.' };

	const [drive, calendar, sheet] = await Promise.all([
		googleReady
			? (async (): Promise<Check> => {
					try {
						let result = await getArchiveIndex();
						const refresh = url.searchParams.has('refresh');
						if (refresh && Date.now() - result.storedAt > MIN_REFRESH_AGE_MS) {
							result = await getArchiveIndex({ force: true });
						}
						const index = result.value;
						const files = index.pieces.reduce((sum, piece) => sum + piece.files.length, 0);
						const categories = [...new Set(index.pieces.map((p) => p.category).filter(Boolean))];
						return {
							state: 'ok',
							details: [
								`${index.pieces.length} Stücke mit ${files} Dateien`,
								...(categories.length ? [`Kategorien: ${categories.join(', ')}`] : []),
								`Stand: ${dateTime.format(new Date(result.storedAt))} (${result.source === 'fresh' ? 'gerade geladen' : 'aus dem Cache'}, ${index.requestCount} Google-Anfragen)`
							]
						};
					} catch (error) {
						return describeError(error, 'den Notenarchiv-Ordner', serviceAccountEmail);
					}
				})()
			: skipped,
		googleReady
			? (async (): Promise<Check> => {
					try {
						const { client } = getGoogle();
						const from = new Date();
						const to = new Date(from.getTime() + 120 * 24 * 60 * 60 * 1000);
						const events = await listEvents(client, requireSetting('CALENDAR_ID'), { from, to });
						const next = events[0];
						return {
							state: 'ok',
							details: [
								`${events.length} Termine in den nächsten 4 Monaten`,
								...(next
									? [
											`Nächster Termin: ${next.title}, ${
												next.allDay ? dateOnly.format(new Date(next.start)) : dateTime.format(new Date(next.start))
											}`
										]
									: [])
							]
						};
					} catch (error) {
						return describeError(error, 'den Kalender', serviceAccountEmail);
					}
				})()
			: skipped,
		googleReady
			? (async (): Promise<Check> => {
					try {
						const info = await getSpreadsheetInfo(getGoogle().client, requireSetting('REPERTOIRE_SHEET_ID'));
						return { state: 'ok', details: [`„${info.title}" mit ${info.tabs.length} Tabellenblättern`] };
					} catch (error) {
						const check = describeError(error, 'die Repertoire-Tabelle', serviceAccountEmail);
						if (check.state === 'missing') check.hint = 'Wird erst ab Phase 4 gebraucht.';
						return check;
					}
				})()
			: skipped
	]);

	return { checks: { account, drive, calendar, sheet } };
};
