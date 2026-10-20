import { describe, expect, it } from 'vitest';
import { buildAccessList } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { buildSignups, coverage, readAnswer, sectionOf, totals } from './signups.ts';

const HEADER = ['Termin', 'Wer', 'Name', 'Antwort', 'Instrument', 'Kommentar', 'Datum', 'Termin-ID'];

const members = buildAccessList({
	members: [
		['E-Mail', 'Name', 'Instrument', 'Gruppen', 'Orchester', 'Status', 'Pausiert bis'],
		['anna@example.org', 'Anna A', 'Geige I & II', '', 'EO', '', ''],
		['ben@example.org', 'Ben B', 'Geige II', '', 'EO', '', ''],
		['carl@example.org', 'Carl C', 'Viola', '', '', '', ''],
		['dora@example.org', 'Dora D', 'Oboe', '', 'A', '', ''],
		['emil@example.org', 'Emil E', 'Horn', '', '', 'pausiert', '']
	]
}).members;

describe('readAnswer', () => {
	it.each([
		['Zusage', 'yes'],
		['ja', 'yes'],
		['Absage', 'no'],
		['nein', 'no'],
		['vielleicht', 'maybe'],
		['', null],
		['???', null]
	])('%j → %j', (text, answer) => {
		expect(readAnswer(text)).toBe(answer);
	});
});

describe('buildSignups', () => {
	it('keeps one answer per person and event, the last row winning', () => {
		const { byEvent } = buildSignups([
			HEADER,
			['Probe', 'Anna@Example.org', 'Anna A', 'Zusage', '', '', '2026-10-20', 'e1'],
			['Probe', 'anna@example.org', 'Anna A', 'Absage', '', 'krank', '2026-10-21', 'e1'],
			['Probe', 'ben@example.org', 'Ben B', 'Vielleicht', 'Viola', '', '2026-10-21', 'e1'],
			['Probe', 'carl@example.org', 'Carl C', 'egal', '', '', '', 'e1'],
			['Konzert', 'carl@example.org', 'Carl C', 'Zusage', '', '', '', 'e2']
		]);
		expect(byEvent.get('e1')!.map((s) => [s.email, s.answer, s.comment])).toEqual([
			['anna@example.org', 'no', 'krank'],
			['ben@example.org', 'maybe', '']
		]);
		expect(byEvent.get('e2')).toHaveLength(1);
	});
});

describe('sectionOf', () => {
	it('takes the instrument given with the answer, else the first one from the profile', () => {
		expect(sectionOf('Viola', members[0], config)).toEqual({ instrument: 'Viola', numbers: [] });
		expect(sectionOf('', members[0], config)).toEqual({ instrument: 'Geige', numbers: [1] });
		expect(sectionOf('', undefined, config)).toBeNull();
	});
});

describe('coverage', () => {
	const { byEvent } = buildSignups([
		HEADER,
		['', 'anna@example.org', '', 'Zusage', '', '', '', 'e1'],
		['', 'ben@example.org', '', 'Absage', '', '', '', 'e1'],
		['', 'gast@example.org', 'Gast', 'Zusage', 'Kontrabass', '', '', 'e1']
	]);

	it('counts per section, with unanswered active members of the orchestra as open', () => {
		const sections = coverage(byEvent.get('e1')!, members, config, { orchestra: 'EO', today: '2026-10-20' });
		expect(sections.map((s) => [s.label, s.yes, s.no, s.open])).toEqual([
			['Geige I', ['Anna A'], [], []],
			['Geige II', [], ['Ben B'], []],
			['Viola', [], [], ['Carl C']],
			['Kontrabass', ['Gast'], [], []]
		]);
		expect(totals(sections)).toEqual({ yes: 2, maybe: 0, no: 1, open: 1 });
	});

	it('leaves out paused members and other orchestras', () => {
		const labels = coverage([], members, config, { orchestra: 'A', today: '2026-10-20' }).map((s) => s.label);
		expect(labels).toEqual(['Oboe', 'Viola']);
	});
});
