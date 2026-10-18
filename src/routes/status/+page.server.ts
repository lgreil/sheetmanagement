import type { PageServerLoad } from './$types';
import { authConfig, requireAdminWhenSignInIsOn } from '#lib/server/auth/index.ts';
import { GoogleApiError } from '#lib/server/google/client.ts';
import { listEvents } from '#lib/server/google/calendar.ts';
import { ACCESS_TABS } from '#lib/access/access.ts';
import { LAYOUT, REPERTOIRE_TABS, type TabKey } from '#lib/repertoire/sheet.ts';
import { getSpreadsheetInfo } from '#lib/server/google/sheets.ts';
import { getRepertoire } from '#lib/server/repertoire.ts';
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

export const load: PageServerLoad = async ({ url, locals }) => {
	requireAdminWhenSignInIsOn(locals);
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
							...(index.programs.length
								? [
										`Aktuelle Programme: ${index.programs
											.map((program) => `${program} (${index.pieces.filter((p) => p.programs?.includes(program)).length})`)
											.join(', ')}`
									]
								: []),
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
						const title = `„${info.title}"`;
						const missing = (keys: readonly TabKey[]) =>
							keys.map((key) => LAYOUT[key].tab).filter((tab) => !info.tabs.includes(tab));
						const setupHint = 'Auf der Seite „Tabelle einrichten“ werden sie angelegt.';
						const missingRepertoire = missing(REPERTOIRE_TABS);
						if (missingRepertoire.length) {
							return {
								state: 'missing',
								details: [title],
								problem: `Es fehlen die Blätter ${missingRepertoire.join(', ')}.`,
								hint: setupHint
							};
						}
						const result = await getRepertoire();
						if (!result.ok) return { state: 'error', details: [title], problem: 'Die Tabelle konnte nicht gelesen werden.' };
						const { pieces, concerts, problems } = result.repertoire;
						// Without the access tabs the repertoire works; only sign-in needs them.
						const missingAccess = missing(ACCESS_TABS);
						return {
							state: 'ok',
							details: [
								title,
								`${pieces.length} Stücke, ${concerts.length} Konzerte`,
								...(problems.length ? [`${problems.length} Hinweise, siehe „Tabelle einrichten“`] : [])
							],
							...(missingAccess.length
								? { problem: `Für die Anmeldung fehlen die Blätter ${missingAccess.join(', ')}.`, hint: setupHint }
								: {})
						};
					} catch (error) {
						const check = describeError(error, 'die Repertoire-Tabelle', serviceAccountEmail);
						if (check.state === 'missing') check.hint = 'Für Programme und „Gespielt bei“. Siehe Anleitung, Schritt 5.';
						if (check.state === 'error' && serviceAccountEmail) {
							check.hint = `Prüfe die ID und teile die Tabelle mit ${serviceAccountEmail} als Bearbeiter.`;
						}
						return check;
					}
				})()
			: skipped
	]);

	const auth = authConfig();
	const signIn: Check =
		auth.mode === 'off'
			? {
					state: 'missing',
					details: [],
					problem: 'GOOGLE_OAUTH_CLIENT_ID ist nicht gesetzt.',
					hint: 'Bis dahin ist die App für alle offen und nur lesbar. Siehe Anleitung, Schritt 9.'
				}
			: {
					state: auth.problems.length ? 'error' : 'ok',
					details: [
						`Weiterleitungs-URI: ${url.origin}/auth/callback`,
						`${auth.bootstrapAdmins.length} Bootstrap-Admins`
					],
					problem: auth.problems.join(' ') || undefined
				};

	return { checks: { account, drive, calendar, sheet, signIn } };
};
