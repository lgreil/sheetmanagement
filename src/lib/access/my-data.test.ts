import { describe, expect, it } from 'vitest';
import { LAYOUT, readTable } from '#lib/repertoire/sheet.ts';
import { exportFileName, myData, pollData, storedData } from './my-data.ts';

const table = <K extends keyof typeof LAYOUT>(key: K, rows: Record<string, string>[]) => {
	const columns = LAYOUT[key].columns as Record<string, string>;
	const keys = Object.keys(columns);
	return readTable([keys.map((k) => columns[k]), ...rows.map((row) => keys.map((k) => row[k] ?? ''))], columns);
};

const who = { email: 'Mia@Example.org', name: 'Mia Beispiel' };

describe('myData', () => {
	const data = myData(who, {
		members: table('members', [
			{ email: 'mia@example.org', name: 'Mia Beispiel', instrument: 'Geige' },
			{ email: 'jonas@example.org', name: 'Jonas' }
		]),
		signups: table('signups', [
			{ event: 'Probe', who: 'mia@example.org', answer: 'Zusage' },
			{ event: 'Probe', who: 'jonas@example.org', answer: 'Absage' }
		]),
		wishes: table('wishes', [
			{ title: 'Bolero', submittedBy: 'Jonas <jonas@example.org>', votes: 'mia@example.org, lea@example.org' },
			{ title: 'Metronom', submittedBy: 'Mia Beispiel <mia@example.org>', votes: 'lea@example.org' },
			{ title: 'Carmen', submittedBy: 'Jonas <jonas@example.org>', votes: 'lea@example.org' }
		]),
		pieceNotes: table('pieceNotes', [
			{ piece: 'Egmont', note: 'ohne Wiederholung', by: 'Mia Beispiel' },
			{ piece: 'Egmont', note: 'leise', by: 'David' }
		])
	});

	it('takes only the member’s rows, by the sheet’s tab and column names', () => {
		expect(data['Mitglieder']).toEqual([{ 'E-Mail': 'mia@example.org', Name: 'Mia Beispiel', Instrument: 'Geige' }]);
		expect(data['Anmeldungen']).toEqual([{ Termin: 'Probe', Wer: 'mia@example.org', Antwort: 'Zusage' }]);
		expect(data['Hinweise']).toEqual([{ Stück: 'Egmont', Hinweis: 'ohne Wiederholung', Von: 'Mia Beispiel' }]);
	});

	it('keeps other people out of wishes: no one else’s +1, no one else’s name', () => {
		expect(data['Wünsche']).toEqual([
			{ Titel: 'Bolero', 'Mein +1': 'ja' },
			{ Titel: 'Metronom', 'Eingereicht von': 'Mia Beispiel <mia@example.org>', 'Mein +1': 'nein' }
		]);
	});

	it('leaves out tabs without rows and tabs that are missing', () => {
		expect(Object.keys(data)).toEqual(['Mitglieder', 'Anmeldungen', 'Wünsche', 'Hinweise']);
	});

	it('finds notes by name only when there is a name', () => {
		const none = myData({ email: 'x@example.org', name: '' }, { pieceNotes: table('pieceNotes', [{ piece: 'A', note: 'b', by: '' }]) });
		expect(none).toEqual({});
	});
});

describe('exportFileName', () => {
	it('makes a safe file name from the email', () => {
		expect(exportFileName('Mia.Beispiel+orchester@Example.org')).toBe('meine-daten-mia-beispiel-orchester-example-org.json');
	});
});

describe('storedData', () => {
	it('names the device’s push service and date, never its keys', () => {
		const data = storedData(
			[{ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', createdAt: '2026-10-23 08:30:00' }],
			[
				{ kind: 'signup', subject: 'event-1', sentAt: '2026-10-24 09:00:00' },
				{ kind: 'loan-due', subject: 'moldau|2026-11-01', sentAt: '2026-10-25 09:00:00' }
			]
		);
		expect(data['Geräte für Benachrichtigungen']).toEqual([
			{ Zustelldienst: 'fcm.googleapis.com', 'Angemeldet seit (UTC)': '2026-10-23 08:30:00', 'Schlüssel zum Verschlüsseln': 'gespeichert, hier nicht ausgegeben' }
		]);
		expect(data['Verschickte Erinnerungen']).toEqual([
			{ Art: 'Zu- oder Absage fehlt', Wofür: 'event-1', 'Verschickt (UTC)': '2026-10-24 09:00:00' },
			{ Art: 'Leihmaterial bald fällig', Wofür: 'moldau, 2026-11-01', 'Verschickt (UTC)': '2026-10-25 09:00:00' }
		]);
		expect(JSON.stringify(data)).not.toContain('/fcm/send/abc');
	});

	it('leaves out what isn’t there', () => {
		expect(storedData([], [])).toEqual({});
	});

	it('says when reminders by email are turned off (#123)', () => {
		expect(storedData([], [], true)).toEqual({ 'Erinnerungen per E-Mail': [{ Stand: 'abbestellt' }] });
	});

	it('says whether the tour was finished or skipped', () => {
		expect(storedData([], [], false, 'skipped')).toEqual({ 'Tour durch die App': [{ Stand: 'übersprungen' }] });
		expect(storedData([], [], false, 'done')).toEqual({ 'Tour durch die App': [{ Stand: 'bis zum Ende angesehen' }] });
	});

	it('includes the member’s own practice time, nothing while it was never on', () => {
		expect(storedData([], [], false, null, { on: false, days: [] })).toEqual({});
		expect(storedData([], [], false, null, { on: true, days: [{ day: '2026-10-24', seconds: 1830 }] })).toEqual({
			Probenzeit: [{ Aufzeichnen: 'ja' }, { Tag: '2026-10-24', Minuten: '31' }]
		});
	});
});

describe('pollData', () => {
	it('lists the dates the member answered, with the answer', () => {
		const poll = {
			id: 'p1',
			title: 'Probenwochenende',
			options: [
				{ id: 'o1', date: '2027-03-06' },
				{ id: 'o2', date: '2027-03-13', start: '10:00', end: '17:00' }
			],
			groups: [],
			createdBy: 'vera@example.org',
			createdByName: 'Vera',
			createdAt: '2027-01-01T00:00:00Z',
			chosen: []
		};
		const response = { email: 'mia@example.org', name: 'Mia', choices: { o2: 'maybe' as const }, comment: 'Nur vormittags', updatedAt: '2027-01-02T10:00:00Z' };
		expect(pollData([{ poll, response }])).toEqual({
			Terminumfragen: [{ Umfrage: 'Probenwochenende', Termin: '2027-03-13 10:00–17:00', Antwort: 'Vielleicht', Kommentar: 'Nur vormittags', 'Geantwortet (UTC)': '2027-01-02T10:00:00Z' }]
		});
		expect(pollData([])).toEqual({});
	});
});
