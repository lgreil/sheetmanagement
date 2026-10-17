import { describe, expect, it } from 'vitest';
import { bachkreis } from './presets/bachkreis.ts';

describe('bachkreis preset', () => {
	it('has no instrument name or alias used twice', () => {
		const seen = new Map<string, string>();
		for (const instrument of bachkreis.instruments) {
			for (const label of [instrument.name, ...(instrument.aliases ?? [])]) {
				const key = label.toLowerCase();
				expect(seen.get(key), `"${label}" is used by ${seen.get(key)} and ${instrument.name}`).toBeUndefined();
				seen.set(key, instrument.name);
			}
		}
	});

	it('recognises the catalogue numbers used in folder names', () => {
		const find = (title: string) =>
			bachkreis.naming.cataloguePatterns.map((p) => title.match(p)?.[0]).find(Boolean);

		expect(find('Bach BWV 147 - Jesu bleibet meine Freude')).toBe('BWV 147');
		expect(find('Mozart KV 492 - Le nozze di Figaro')).toBe('KV 492');
		expect(find('Mendelssohn Op. 90 - Sinfonie Nr. 4 Italienische')).toBe('Op. 90');
		expect(find('Superman Returns')).toBeUndefined();
	});
});
