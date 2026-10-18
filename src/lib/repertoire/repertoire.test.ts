import { describe, expect, it } from 'vitest';
import { formatFuzzyDate, fuzzyDateKey, parseFuzzyDate } from './dates.ts';
import { linkSources, planSync, toSheetRow, type CalendarConcert, type DrivePiece } from './link.ts';
import { buildRepertoire, readTable, type SheetValues } from './sheet.ts';

describe('parseFuzzyDate', () => {
	it.each([
		['1957', { year: 1957 }],
		['1957-12', { year: 1957, month: 12 }],
		['1957-12-21', { year: 1957, month: 12, day: 21 }],
		['12.1957', { year: 1957, month: 12 }],
		['21.12.1957', { year: 1957, month: 12, day: 21 }],
		[' 1.2.2026 ', { year: 2026, month: 2, day: 1 }]
	])('reads %j', (text, expected) => {
		expect(parseFuzzyDate(text)).toEqual(expected);
	});

	it.each(['', 'Dezember', '1957-13', '31.02.2026', '57'])('rejects %j', (text) => {
		expect(parseFuzzyDate(text)).toBeNull();
	});

	it('sorts and formats by precision', () => {
		expect(fuzzyDateKey({ year: 1957, month: 3, day: 4 })).toBe('1957-03-04');
		expect(fuzzyDateKey({ year: 1957 })).toBe('1957');
		expect(formatFuzzyDate({ year: 1957 }, 'de-DE').long).toBe('1957');
		expect(formatFuzzyDate({ year: 1957, month: 12 }, 'de-DE').long).toBe('Dezember 1957');
		expect(formatFuzzyDate({ year: 1957, month: 12, day: 21 }, 'de-DE')).toEqual({
			long: 'Samstag, 21. Dezember 1957',
			day: '21',
			// "Dez" or "Dez.", depending on the ICU version
			month: expect.stringMatching(/^Dez/),
			year: '1957'
		});
	});
});

describe('readTable', () => {
	it('finds columns by header in any order and skips empty rows', () => {
		const table = readTable(
			[
				['  stück ', 'Extra', 'Konzert'],
				['Sleigh Ride', 'x', 'Weihnachtskonzert 1962'],
				['', '', ''],
				['Bolero']
			],
			{ concert: 'Konzert', piece: 'Stück', notes: 'Notiz' }
		);
		expect(table.missing).toEqual(['notes']);
		expect(table.indexes).toEqual({ piece: 0, concert: 2 });
		expect(table.rows).toEqual([
			{ row: 2, values: { concert: 'Weihnachtskonzert 1962', piece: 'Sleigh Ride', notes: '' } },
			{ row: 4, values: { concert: '', piece: 'Bolero', notes: '' } }
		]);
	});
});

const PIECES_HEADER = ['Titel', 'Komponist', 'Werkverzeichnis', 'Arrangeur', 'Genre', 'Schwierigkeit', 'Notiz', 'Geprüft am', 'Drive-Ordner-ID'];
const CONCERTS_HEADER = ['Datum', 'Anlass', 'Ort', 'Orchester', 'Kalender-Event-ID'];
const PROGRAM_HEADER = ['Konzert', 'Nr.', 'Stück', 'Notiz'];

const piece = (title: string, folder = '', composer = '') => [title, composer, '', '', '', '', '', '', folder];

function sample(): SheetValues {
	return {
		pieces: [
			PIECES_HEADER,
			piece('Jesu bleibet meine Freude', 'folder-jesu', 'Bach'),
			piece('Sleigh Ride'),
			piece('Doppelt', 'folder-jesu')
		],
		concerts: [
			CONCERTS_HEADER,
			['1962-12', 'Weihnachtskonzert 1962', 'Aula', 'EO', ''],
			['2026-11-15', 'Herbstkonzert 2026', 'Kirche', 'EO', 'event-herbst'],
			['irgendwann', 'Sommerfest', '', '', '']
		],
		program: [
			PROGRAM_HEADER,
			['Herbstkonzert 2026', '', 'Sleigh Ride', 'Zugabe'],
			['Herbstkonzert 2026', '1', 'jesu bleibet meine freude', ''],
			['Weihnachtskonzert 1962', '3', 'Sleigh Ride', ''],
			['Unbekanntes Konzert', '1', 'Sleigh Ride', ''],
			['Weihnachtskonzert 1962', '1', 'Gibt es nicht', '']
		]
	};
}

describe('buildRepertoire', () => {
	const repertoire = buildRepertoire(sample());

	it('keys pieces by Drive folder, or by title without one', () => {
		expect(repertoire.pieces.map((p) => p.key)).toEqual(['folder-jesu', 's-sleigh-ride']);
		expect(repertoire.piecesByFolder.get('folder-jesu')?.composer).toBe('Bach');
	});

	it('keys concerts by event id, or by Anlass', () => {
		expect(repertoire.concerts.map((c) => c.key)).toEqual(['s-weihnachtskonzert-1962', 'event-herbst', 's-sommerfest']);
		expect(repertoire.concertsByKey.get('s-sommerfest')?.date).toBeNull();
	});

	it('orders programmes by number, unnumbered rows last', () => {
		const herbst = repertoire.concertsByEvent.get('event-herbst')!;
		expect(herbst.program.map((e) => [e.position, e.pieceKey, e.notes])).toEqual([
			[1, 'folder-jesu', undefined],
			[undefined, 's-sleigh-ride', 'Zugabe']
		]);
	});

	it('lists where a piece was played, oldest first', () => {
		expect(repertoire.playedAt.get('s-sleigh-ride')).toEqual(['s-weihnachtskonzert-1962', 'event-herbst']);
	});

	it('reports problems instead of failing', () => {
		expect(repertoire.problems.map((p) => [p.kind, p.row, p.value])).toEqual([
			['duplicate-piece', 4, 'Doppelt'],
			['bad-date', 4, 'irgendwann'],
			['unknown-concert', 5, 'Unbekanntes Konzert'],
			['unknown-piece', 6, 'Gibt es nicht']
		]);
	});

	it('reports missing columns', () => {
		const result = buildRepertoire({ pieces: [['Titel']], concerts: [CONCERTS_HEADER], program: [PROGRAM_HEADER] });
		expect(result.problems.filter((p) => p.kind === 'missing-column').map((p) => p.value)).toContain('Drive-Ordner-ID');
	});
});

describe('linkSources and planSync', () => {
	const drive: DrivePiece[] = [
		{ id: 'folder-jesu', title: 'Jesu bleibet meine Freude', composer: 'Bach', catalogue: 'BWV 147', folderName: 'Bach BWV 147 - Jesu bleibet meine Freude' },
		{ id: 'folder-sleigh', title: 'Sleigh Ride', folderName: 'Sleigh Ride' },
		{ id: 'folder-ave-1', title: 'Ave Maria', composer: 'Schubert', folderName: 'Schubert - Ave Maria' },
		{ id: 'folder-ave-2', title: 'Ave Maria', composer: 'Gounod', folderName: 'Gounod - Ave Maria' }
	];
	const calendar: CalendarConcert[] = [
		{ id: 'event-herbst', displayTitle: 'Herbstkonzert', start: '2026-11-15T17:00:00+01:00', allDay: false, tentative: false },
		{ id: 'event-weihnacht', displayTitle: 'Weihnachtskonzert', start: '2026-12-20', allDay: true, location: 'Kirche', tentative: false },
		{ id: 'event-weihnacht-2', displayTitle: 'Weihnachtskonzert', start: '2026-12-21', allDay: true, tentative: false },
		{ id: 'event-maybe', displayTitle: 'Sommerkonzert', start: '2027-06-01', allDay: true, tentative: true }
	];

	it('links by id, then hand-entered rows by title or date', () => {
		const values = sample();
		values.concerts.push(['2026-12-20', 'Adventskonzert 2026', '', 'EO', '']);
		const repertoire = buildRepertoire(values);
		const links = linkSources(repertoire, drive, calendar, 'Europe/Berlin');
		expect(links.pieceByFolder.get('folder-jesu')?.key).toBe('folder-jesu');
		expect(links.pieceByFolder.get('folder-sleigh')?.key).toBe('s-sleigh-ride');
		expect(links.concertByEvent.get('event-weihnacht')?.title).toBe('Adventskonzert 2026');
		expect(links.eventByConcert.get('event-herbst')).toBe('event-herbst');
	});

	it('plans rows for new folders and confirmed concerts, with unique names', () => {
		const repertoire = buildRepertoire(sample());
		const links = linkSources(repertoire, drive, calendar, 'Europe/Berlin');
		const plan = planSync(repertoire, links, drive, calendar, { timeZone: 'Europe/Berlin', orchestra: 'EO' });
		expect(plan.pieces).toEqual([
			{ title: 'Ave Maria', composer: 'Schubert', catalogue: '', driveFolderId: 'folder-ave-1' },
			{ title: 'Ave Maria (Gounod)', composer: 'Gounod', catalogue: '', driveFolderId: 'folder-ave-2' }
		]);
		expect(plan.concerts).toEqual([
			{ date: '2026-12-20', title: 'Weihnachtskonzert 2026', location: 'Kirche', orchestra: 'EO', eventId: 'event-weihnacht' },
			{ date: '2026-12-21', title: 'Weihnachtskonzert 2026 (21.12.)', location: '', orchestra: 'EO', eventId: 'event-weihnacht-2' }
		]);
	});

	it('writes rows in the sheet\'s column order', () => {
		expect(toSheetRow({ title: 'A', eventId: 'e' }, { eventId: 3, title: 1, date: 0 })).toEqual(['', 'A', '', 'e']);
	});
});
