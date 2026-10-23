import { describe, expect, it } from 'vitest';
import { matchKnownPlaces, mergePlaces, placeLabel, MAX_PLACES } from './places.ts';

describe('placeLabel', () => {
	it('joins name, street and town', () => {
		expect(placeLabel({ name: 'Lambertikirche', street: 'Lambertikirchplatz', housenumber: '1', postcode: '48143', city: 'Münster' })).toBe(
			'Lambertikirche, Lambertikirchplatz 1, 48143 Münster'
		);
	});

	it('leaves out what is missing or repeated', () => {
		expect(placeLabel({ name: 'Münster', city: 'Münster' })).toBe('Münster');
		expect(placeLabel({ street: 'Domplatz', district: 'Altstadt' })).toBe('Domplatz, Altstadt');
		expect(placeLabel({})).toBe('');
	});
});

describe('matchKnownPlaces', () => {
	const known = ['Aula, Musterschule', 'Kirche am Markt', 'Kirche am Markt', 'Aula,  Musterschule', 'Stadthalle Süd'];

	it('finds places with every typed word, the most used first', () => {
		expect(matchKnownPlaces(known, 'aula')).toEqual(['Aula, Musterschule']);
		expect(matchKnownPlaces(known, 'markt kirche')).toEqual(['Kirche am Markt']);
		expect(matchKnownPlaces([...known, 'Kirche St. Peter'], 'kirche')).toEqual(['Kirche am Markt', 'Kirche St. Peter']);
	});

	it('ignores accents and an empty query', () => {
		expect(matchKnownPlaces(known, 'sud')).toEqual(['Stadthalle Süd']);
		expect(matchKnownPlaces(known, '  ')).toEqual([]);
	});
});

describe('mergePlaces', () => {
	it('keeps known places first, each once, and stops at the limit', () => {
		expect(mergePlaces(['Kirche am Markt'], ['kirche am markt', 'Markt 1, Musterstadt'])).toEqual(['Kirche am Markt', 'Markt 1, Musterstadt']);
		expect(mergePlaces([], Array.from({ length: 10 }, (_, i) => `Ort ${i}`))).toHaveLength(MAX_PLACES);
	});
});
