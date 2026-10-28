import { describe, expect, it } from 'vitest';
import { readTable } from '#lib/repertoire/sheet.ts';
import { checkInstruments, checkSettings, planInstrumentSave, planSettingsSave, readInstrumentOverrides, readSettings, validLogo, type SettingsForm } from './settings.ts';

const columns = { key: 'Einstellung', value: 'Wert' };
const table = (rows: string[][]) => readTable([['Einstellung', 'Wert'], ...rows], columns);
const form: SettingsForm = { name: '', shortName: '', logo: '', accent: '', look: '', featuresOff: [], retention: '', links: '' };

describe('readSettings', () => {
	it('reads the rows by their German names, in any case', () => {
		expect(
			readSettings(
				table([
					['Name', 'Musterorchester'],
					['akzentfarbe', '#1D4ED8'],
					['Logo', '/demo/logo.svg'],
					['Ausgeschaltet', 'loans, musicReport']
				]).rows
			)
		).toEqual({ name: 'Musterorchester', accent: '#1d4ed8', logo: '/demo/logo.svg', featuresOff: ['loans', 'musicReport'] });
	});

	it('ignores empty values, unknown rows and values that could break the page', () => {
		expect(
			readSettings(
				table([
					['Name', ''],
					['Lieblingsfarbe', 'grün'],
					['Akzentfarbe', 'red;}'],
					['Logo', 'javascript:alert(1)']
				]).rows
			)
		).toEqual({});
	});

	it('knows that nothing is off once the page saved the features', () => {
		expect(readSettings(table([['Ausgeschaltet', '']]).rows)).toEqual({ featuresOff: [] });
	});
});

describe('validLogo', () => {
	it('takes paths in the app and https links only', () => {
		expect(validLogo(' /logo.png ')).toBe('/logo.png');
		expect(validLogo('https://example.org/logo.svg')).toBe('https://example.org/logo.svg');
		for (const bad of ['//evil.example/x.png', 'http://example.org/x.png', 'data:image/png;base64,AAAA', 'https://x/"onerror="']) {
			expect(validLogo(bad)).toBeUndefined();
		}
	});
});

describe('checkSettings', () => {
	it('accepts empty fields, which mean the default', () => {
		expect(checkSettings(form)).toEqual({ ok: true });
	});

	it('names the first field that cannot be saved', () => {
		expect(checkSettings({ ...form, shortName: 'Ein viel zu langer Kurzname' })).toEqual({ ok: false, field: 'shortName' });
		expect(checkSettings({ ...form, logo: 'ftp://x' })).toEqual({ ok: false, field: 'logo' });
		expect(checkSettings({ ...form, accent: 'blau' })).toEqual({ ok: false, field: 'accent' });
	});
});

describe('retention', () => {
	it('reads and checks a number of seasons from 1 to 20', () => {
		expect(readSettings(table([['Aufbewahrung (Saisons)', '3']]).rows)).toEqual({ retention: 3 });
		expect(readSettings(table([['Aufbewahrung (Saisons)', 'immer']]).rows)).toEqual({});
		expect(checkSettings({ ...form, retention: '0' })).toEqual({ ok: false, field: 'retention' });
		expect(checkSettings({ ...form, retention: ' 5 ' })).toEqual({ ok: true });
	});
});

describe('links', () => {
	it('reads the footer links from their row, with an icon each', () => {
		expect(readSettings(table([['Links', 'Website https://example.org\nInstagram https://www.instagram.com/orchester/']]).rows)).toEqual({
			links: [
				{ label: 'Website', url: 'https://example.org/', icon: 'globe' },
				{ label: 'Instagram', url: 'https://www.instagram.com/orchester/', icon: 'instagram' }
			]
		});
		// An empty row is no links of its own: the variable's, or none.
		expect(readSettings(table([['Links', '']]).rows)).toEqual({});
	});

	it('wants a web link on every line', () => {
		expect(checkSettings({ ...form, links: 'Website https://example.org\nInstagram' })).toEqual({ ok: false, field: 'links' });
		expect(checkSettings({ ...form, links: 'Website javascript:alert(1)' })).toEqual({ ok: false, field: 'links' });
		expect(checkSettings({ ...form, links: 'Website https://example.org; https://facebook.com/orchester' })).toEqual({ ok: true });
	});
});

describe('planSettingsSave', () => {
	it('adds every setting to an empty tab', () => {
		const plan = planSettingsSave(table([]), { ...form, name: 'Muster', featuresOff: ['loans'], retention: '3' });
		expect(plan.updates).toEqual([]);
		expect(plan.append).toEqual([
			{ key: 'Name', value: 'Muster' },
			{ key: 'Kurzname', value: '' },
			{ key: 'Logo', value: '' },
			{ key: 'Akzentfarbe', value: '' },
			{ key: 'Stil', value: '' },
			{ key: 'Ausgeschaltet', value: 'loans' },
			{ key: 'Aufbewahrung (Saisons)', value: '3' },
			{ key: 'Links', value: '' }
		]);
	});

	it('changes only the rows whose value changed', () => {
		const existing = table([
			['Name', 'Muster'],
			['Kurzname', ''],
			['Logo', ''],
			['Akzentfarbe', '#e6b422'],
			['Stil', ''],
			['Ausgeschaltet', ''],
			['Aufbewahrung (Saisons)', ''],
			['Links', '']
		]);
		const plan = planSettingsSave(existing, { ...form, name: 'Muster', accent: '#1D4ED8' });
		expect(plan).toEqual({ updates: [{ row: 5, values: { value: '#1d4ed8' } }], append: [] });
	});
});

describe('look (#163)', () => {
	it('reads the German word or the key, and ignores anything else', () => {
		expect(readSettings(table([['Stil', 'Schlicht']]).rows)).toEqual({ look: 'plain' });
		expect(readSettings(table([['stil', 'bold']]).rows)).toEqual({ look: 'bold' });
		expect(readSettings(table([['Stil', 'verschnörkelt']]).rows)).toEqual({});
	});

	it('saves the German word and refuses unknown looks', () => {
		expect(checkSettings({ ...form, look: 'plain' })).toEqual({ ok: true });
		expect(checkSettings({ ...form, look: 'fancy' })).toEqual({ ok: false, field: 'look' });
		expect(planSettingsSave(table([['Stil', '']]), { ...form, look: 'plain' }).updates).toEqual([{ row: 2, values: { value: 'schlicht' } }]);
	});
});

describe('instrument overrides (#143)', () => {
	const columns = { name: 'Instrument', label: 'Anzeige', aliases: 'Weitere Schreibweisen' };
	const instruments = (rows: string[][]) => readTable([['Instrument', 'Anzeige', 'Weitere Schreibweisen'], ...rows], columns);

	it('reads labels and spellings of known instruments only', () => {
		expect(
			readInstrumentOverrides(
				instruments([
					['geige', 'Violine', 'Vl., Violine I'],
					['Kazoo', 'Summer', ''],
					['Viola', '<b>', 'ok, <script>']
				]).rows,
				['Geige', 'Viola']
			)
		).toEqual({ Geige: { label: 'Violine', aliases: ['Vl.', 'Violine I'] }, Viola: { aliases: ['ok'] } });
	});

	it('names the first instrument that cannot be saved', () => {
		expect(checkInstruments([{ name: 'Geige', label: 'Violine', aliases: 'Vl.' }])).toBeUndefined();
		expect(checkInstruments([{ name: 'Viola', label: 'Bratsche<', aliases: '' }])).toBe('Viola');
	});

	it('changes rows that differ and adds instruments that have something of their own', () => {
		const table = instruments([['Geige', 'Violine', '']]);
		expect(
			planInstrumentSave(table, [
				{ name: 'Geige', label: '', aliases: '' },
				{ name: 'Viola', label: 'Bratsche', aliases: 'Br, Br' },
				{ name: 'Flöte', label: '', aliases: '' }
			])
		).toEqual({
			updates: [{ row: 2, values: { label: '', aliases: '' } }],
			append: [{ name: 'Viola', label: 'Bratsche', aliases: 'Br' }]
		});
	});
});
