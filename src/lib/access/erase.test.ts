import { describe, expect, it } from 'vitest';
import { LAYOUT, readTable } from '#lib/repertoire/sheet.ts';
import { planErase, pseudonym } from './erase.ts';

const tab = <K extends keyof typeof LAYOUT>(key: K, rows: string[][]) =>
	readTable([Object.values(LAYOUT[key].columns as Record<string, string>), ...rows], LAYOUT[key].columns as Record<string, string>);
const row = <K extends keyof typeof LAYOUT>(key: K, values: Record<string, string>) =>
	Object.keys(LAYOUT[key].columns).map((column) => values[column] ?? '');

const mia = { email: 'Mia@Example.org', name: 'Mia Muster' };
const options = { id: 'abc', anonymous: 'Ehemaliges Mitglied' };

describe('planErase', () => {
	const tables = {
		members: tab('members', [row('members', { email: 'mia@example.org', name: 'Mia Muster' }), row('members', { email: 'ben@example.org', name: 'Ben' })]),
		rights: tab('rights', [row('rights', { who: 'mia@example.org', right: 'programme.bearbeiten' }), row('rights', { who: 'Vorstand', right: 'mitglieder.verwalten' })]),
		signups: tab('signups', [
			row('signups', { who: 'mia@example.org', name: 'Mia Muster', answer: 'ja', instrument: 'Viola', comment: 'komme später', eventId: 'e1' }),
			row('signups', { who: 'ben@example.org', name: 'Ben', answer: 'ja', eventId: 'e1' })
		]),
		wishes: tab('wishes', [
			row('wishes', { title: 'Bolero', submittedBy: 'Mia Muster <mia@example.org>', votes: 'ben@example.org, mia@example.org' }),
			row('wishes', { title: 'Finlandia', submittedBy: 'Ben <ben@example.org>', votes: 'ben@example.org' })
		]),
		pieceNotes: tab('pieceNotes', [row('pieceNotes', { text: 'Sprung nach 88', by: 'Mia Muster' })])
	};

	it('removes what is only about the member and puts a pseudonym where rows also count for others', () => {
		const plan = Object.fromEntries(planErase(mia, tables, options).map((change) => [change.key, change]));
		expect(plan.members).toEqual({ key: 'members', remove: [2], anonymise: [] });
		expect(plan.rights).toEqual({ key: 'rights', remove: [2], anonymise: [] });
		expect(plan.signups.anonymise).toEqual([{ row: 2, values: { who: pseudonym('abc'), name: 'Ehemaliges Mitglied', comment: '' } }]);
		expect(plan.wishes.anonymise).toEqual([{ row: 2, values: { submittedBy: '', votes: `ben@example.org, ${pseudonym('abc')}` } }]);
		expect(plan.pieceNotes.anonymise).toEqual([{ row: 2, values: { by: '' } }]);
	});

	it('changes the member row last, and leaves tabs without their data out', () => {
		const keys = planErase(mia, tables, options).map((change) => change.key);
		expect(keys.at(-1)).toBe('members');
		expect(planErase({ email: 'nobody@example.org', name: '' }, tables, options)).toEqual([]);
	});

	it('finds notes by name only when there is a name', () => {
		const keys = planErase({ email: 'mia@example.org', name: '' }, tables, options).map((change) => change.key);
		expect(keys).not.toContain('pieceNotes');
	});
});
