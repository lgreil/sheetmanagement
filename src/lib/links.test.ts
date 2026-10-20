import { describe, expect, it } from 'vitest';
import { bachkreis } from '#lib/config/presets/bachkreis.ts';
import { orchestraLinks } from './links.ts';

describe('orchestraLinks', () => {
	it('keeps set web links with a label, defaulting the icon to a globe', () => {
		expect(
			orchestraLinks([
				{ label: 'Website', url: 'https://example.org' },
				{ label: 'Instagram', url: 'https://instagram.com/example', icon: 'instagram' },
				{ label: 'Kaputt', url: 'javascript:alert(1)' },
				{ label: 'Leer', url: '' },
				{ label: ' ', url: 'https://example.org/ohne-namen' }
			])
		).toEqual([
			{ label: 'Website', url: 'https://example.org/', icon: 'globe' },
			{ label: 'Instagram', url: 'https://instagram.com/example', icon: 'instagram' }
		]);
	});

	it('shows nothing when no links are configured', () => {
		expect(orchestraLinks(undefined)).toEqual([]);
	});

	it('never links the source code for the Bachkreis', () => {
		expect(bachkreis.sourceUrl).toBeUndefined();
	});
});
