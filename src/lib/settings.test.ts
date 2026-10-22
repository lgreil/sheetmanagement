import { describe, expect, it } from 'vitest';
import { readTable } from '#lib/repertoire/sheet.ts';
import { checkInstruments, checkSettings, planInstrumentSave, planSettingsSave, readInstrumentOverrides, readSettings, validLogo, type SettingsForm } from './settings.ts';

const columns = { key: 'Einstellung', value: 'Wert' };
const table = (rows: string[][]) => readTable([['Einstellung', 'Wert'], ...rows], columns);
const form: SettingsForm = { name: '', shortName: '', logo: '', accent: '', featuresOff: [] };

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

describe('planSettingsSave', () => {
	it('adds every setting to an empty tab', () => {
		const plan = planSettingsSave(table([]), { ...form, name: 'Muster', featuresOff: ['loans'] });
		expect(plan.updates).toEqual([]);
		expect(plan.append).toEqual([
			{ key: 'Name', value: 'Muster' },
			{ key: 'Kurzname', value: '' },
			{ key: 'Logo', value: '' },
			{ key: 'Akzentfarbe', value: '' },
			{ key: 'Ausgeschaltet', value: 'loans' }
		]);
	});

	it('changes only the rows whose value changed', () => {
		const existing = table([
			['Name', 'Muster'],
			['Kurzname', ''],
			['Logo', ''],
			['Akzentfarbe', '#e6b422'],
			['Ausgeschaltet', '']
		]);
		const plan = planSettingsSave(existing, { ...form, name: 'Muster', accent: '#1D4ED8' });
		expect(plan).toEqual({ updates: [{ row: 5, values: { value: '#1d4ed8' } }], append: [] });
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
