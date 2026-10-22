import { describe, expect, it } from 'vitest';
import { LAYOUT, readTable } from '#lib/repertoire/sheet.ts';
import { exportFileName, myData } from './my-data.ts';

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
