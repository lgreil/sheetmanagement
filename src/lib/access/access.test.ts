import { describe, expect, it } from 'vitest';
import { planProgramSave, parseEntries, programVersion } from '#lib/repertoire/program-edit.ts';
import { readTable } from '#lib/repertoire/sheet.ts';
import { buildAccessList, parseEmailList, resolveAccess, RIGHTS } from './access.ts';

const list = buildAccessList({
	members: [
		['E-Mail', 'Name', 'Instrument', 'Gruppen'],
		['Anna@Example.org', 'Anna', 'Geige', 'Vorstand, Geigen'],
		['ben@example.org', 'Ben', 'Cello', ''],
		['anna@example.org', 'Anna doppelt', '', '']
	],
	groups: [['Gruppe', 'Beschreibung'], ['Vorstand', 'Leitet den Verein']],
	rights: [
		['Wer', 'Recht'],
		['vorstand', 'mitglieder.verwalten'],
		['BEN@example.org', 'programme.bearbeiten'],
		['carl@example.org', 'programme.bearbeiten'],
		['Vorstand', 'alles']
	],
	requests: [['E-Mail', 'Name', 'Angefragt am'], ['Dora@Example.org', 'Dora', '2026-10-18']]
});

const user = (email: string) => ({ email, name: email });

describe('buildAccessList', () => {
	it('reads members, groups, grants and requests', () => {
		expect(list.present).toBe(true);
		expect(list.members.map((m) => [m.email, m.groups])).toEqual([
			['anna@example.org', ['Vorstand', 'Geigen']],
			['ben@example.org', []]
		]);
		expect(list.groups).toEqual([{ row: 2, name: 'Vorstand', description: 'Leitet den Verein' }]);
		expect(list.requests[0].email).toBe('dora@example.org');
		expect(list.problems.map((p) => [p.kind, p.row])).toEqual([
			['duplicate-member', 4],
			['unknown-right', 5]
		]);
	});

	it('copes with missing tabs', () => {
		const empty = buildAccessList({});
		expect(empty.present).toBe(false);
		expect(resolveAccess(user('anna@example.org'), empty, []).member).toBe(false);
	});
});

describe('resolveAccess', () => {
	it('gives members "ansehen" plus rights of their email and groups', () => {
		expect([...resolveAccess(user('ANNA@example.org'), list, []).rights]).toEqual(['ansehen', 'mitglieder.verwalten']);
		expect([...resolveAccess(user('ben@example.org'), list, []).rights]).toEqual(['ansehen', 'programme.bearbeiten']);
	});

	it('gives nothing to people not in "Mitglieder", even with a grant', () => {
		const carl = resolveAccess(user('carl@example.org'), list, []);
		expect(carl.member).toBe(false);
		expect(carl.rights.size).toBe(0);
		expect(resolveAccess(null, list, []).member).toBe(false);
	});

	it('gives bootstrap admins every right, even without a sheet', () => {
		const admin = resolveAccess(user('Root@Example.org'), null, parseEmailList('root@example.org, second@example.org'));
		expect(admin.bootstrapAdmin).toBe(true);
		expect([...admin.rights]).toEqual([...RIGHTS]);
	});
});

describe('programme editor', () => {
	const table = readTable(
		[
			['Konzert', 'Nr.', 'Stück', 'Notiz'],
			['Herbstkonzert 2026', '1', 'Bolero', ''],
			['Weihnachtskonzert 2026', '1', 'Sleigh Ride', ''],
			['herbstkonzert 2026', '2', 'Jesu bleibet meine Freude', 'Zugabe']
		],
		{ concert: 'Konzert', position: 'Nr.', piece: 'Stück', notes: 'Notiz' }
	);

	it('accepts only well-formed entries', () => {
		expect(parseEntries('[{"piece":" Bolero ","notes":""}]')).toEqual([{ piece: 'Bolero', notes: '' }]);
		expect(parseEntries('[{"piece":""}]')).toBeNull();
		expect(parseEntries('{"piece":"Bolero"}')).toBeNull();
		expect(parseEntries('not json')).toBeNull();
	});

	it('detects changes made in the meantime', () => {
		const before = programVersion(table, 'Herbstkonzert 2026');
		const changed = { ...table, rows: table.rows.map((r) => (r.row === 4 ? { ...r, values: { ...r.values, notes: '' } } : r)) };
		expect(programVersion(changed, 'Herbstkonzert 2026')).not.toBe(before);
		expect(programVersion(changed, 'Weihnachtskonzert 2026')).toBe(programVersion(table, 'Weihnachtskonzert 2026'));
	});

	it('replaces only this concert\'s rows, numbered in the new order', () => {
		const plan = planProgramSave(table, 'Herbstkonzert 2026', [
			{ piece: 'Jesu bleibet meine Freude', notes: 'Zugabe' },
			{ piece: 'Bolero', notes: '' }
		]);
		expect(plan.remove).toEqual([2, 4]);
		expect(plan.append).toEqual([
			{ concert: 'Herbstkonzert 2026', position: '1', piece: 'Jesu bleibet meine Freude', notes: 'Zugabe' },
			{ concert: 'Herbstkonzert 2026', position: '2', piece: 'Bolero', notes: '' }
		]);
	});
});
