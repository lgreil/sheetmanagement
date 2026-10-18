import { describe, expect, it } from 'vitest';
import { buildFeedback, newId, parseVotes, safeLink, sortWishes, toggleVote } from './feedback.ts';

const REPORT_HEADER = ['Stück', 'Drive-Ordner-ID', 'Stimme', 'Datei-ID', 'Art', 'Kommentar', 'Status', 'Notiz', 'Gemeldet von', 'Gemeldet am', 'Meldungs-ID'];
const WISH_HEADER = ['Art', 'Titel', 'Komponist', 'Link', 'Beschreibung', 'Status', 'Antwort', 'Eingereicht von', 'Datum', '+1', 'Wunsch-ID'];

describe('reports', () => {
	it('reads rows and maps dropdown labels back to keys, ignoring case', () => {
		const { reports } = buildFeedback({
			reports: [
				REPORT_HEADER,
				['Sleigh Ride', 'folder-1', 'Geige II', 'file-1', 'schlechter scan', 'Seite 2 unleserlich', 'offen', '', 'Anna <anna@x.org>', '2026-10-18', 'r1'],
				['Sleigh Ride', 'folder-1', '', '', 'Stimme fehlt', '', 'Erledigt', 'neu gescannt', 'Ben', '2026-10-01', 'r2'],
				// Without an id or piece the row can't be changed later, so it's skipped.
				['Ohne ID', 'folder-2', '', '', 'Sonstiges', '', 'offen', '', '', '', '']
			]
		});
		expect(reports.map((r) => [r.id, r.kind, r.status, r.part])).toEqual([
			['r1', 'scan', 'open', 'Geige II'],
			['r2', 'missing', 'done', '']
		]);
		expect(reports[0].row).toBe(2);
	});

	it('treats unknown kinds as "other" and empty status as open', () => {
		const { reports } = buildFeedback({
			reports: [REPORT_HEADER, ['X', 'f', '', '', 'Kaffeefleck', '', '', '', '', '', 'r1']]
		});
		expect(reports[0]).toMatchObject({ kind: 'other', status: 'open' });
	});

	it('works without the tabs', () => {
		expect(buildFeedback({})).toMatchObject({ reports: [], wishes: [], tables: { reports: undefined, wishes: undefined } });
	});

	it('finds columns in any order', () => {
		const { reports } = buildFeedback({
			reports: [[...REPORT_HEADER].reverse(), ['r9', '2026-10-18', 'Anna', '', 'offen', '', 'Seiten fehlen', '', '', 'folder-9', 'Stück 9']]
		});
		expect(reports[0]).toMatchObject({ id: 'r9', pieceId: 'folder-9', kind: 'pages', pieceName: 'Stück 9' });
	});
});

describe('wishes', () => {
	const wishes = buildFeedback({
		wishes: [
			WISH_HEADER,
			['Stück', 'Bolero', 'Ravel', 'https://example.org/bolero', 'Wäre toll', 'offen', '', 'A', '2026-10-01', 'a@x.org, b@x.org', 'w1'],
			['Funktion', 'Dunkler Modus', '', 'javascript:alert(1)', 'Dunkler Modus für Proben', 'erledigt', 'Gibt es schon', 'B', '2026-10-02', 'a@x.org, b@x.org, c@x.org', 'w2'],
			['stück', 'Carmen', 'Bizet', '', '', 'Geplant', '', 'C', '2026-10-03', 'C@X.org; c@x.org', 'w3'],
			['Stück', 'Neu', '', 'nicht mal ein Link', '', '', '', 'D', '2026-10-04', '', 'w4']
		]
	}).wishes;

	it('reads kinds, statuses and +1s', () => {
		expect(wishes.map((w) => [w.id, w.kind, w.status, w.votes.length])).toEqual([
			['w1', 'piece', 'open', 2],
			['w2', 'feature', 'done', 3],
			['w3', 'piece', 'planned', 1],
			['w4', 'piece', 'open', 0]
		]);
	});

	it('keeps only http(s) links, so a cell edited by hand cannot become a script link', () => {
		expect(wishes.map((w) => w.link)).toEqual(['https://example.org/bolero', undefined, undefined, undefined]);
	});

	it('sorts open and planned first, then by +1s, then newest first', () => {
		expect(sortWishes(wishes).map((w) => w.id)).toEqual(['w1', 'w3', 'w4', 'w2']);
	});
});

describe('+1s', () => {
	it('counts each person once, case-insensitively', () => {
		expect(parseVotes(' A@x.org,a@x.org;b@x.org  kein-email ')).toEqual(['a@x.org', 'b@x.org']);
	});

	it('gives and takes back a +1', () => {
		expect(toggleVote(['a@x.org'], 'B@x.org')).toEqual(['a@x.org', 'b@x.org']);
		expect(toggleVote(['a@x.org', 'b@x.org'], 'A@X.org')).toEqual(['b@x.org']);
	});
});

describe('safeLink', () => {
	it.each([
		['https://youtu.be/abc', 'https://youtu.be/abc'],
		['http://verlag.example/stueck?id=1', 'http://verlag.example/stueck?id=1'],
		['  https://example.org  ', 'https://example.org/'],
		['javascript:alert(1)', undefined],
		['data:text/html,<script>', undefined],
		['www.example.org', undefined],
		['', undefined]
	])('%j → %j', (input, expected) => {
		expect(safeLink(input)).toBe(expected);
	});
});

it('makes short, distinct ids', () => {
	const ids = new Set(Array.from({ length: 50 }, newId));
	expect(ids.size).toBe(50);
	expect([...ids][0]).toMatch(/^[0-9a-f]{12}$/);
});
