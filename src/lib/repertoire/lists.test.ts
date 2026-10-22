import { describe, expect, it } from 'vitest';
import { listCompletions, listHas, listItems, listsOverlap, splitList, tidyList } from './lists.ts';

describe('lists of names', () => {
	it('splits on commas and semicolons, without empties or repeats', () => {
		expect(splitList('Mozart,  Haydn; mozart, ')).toEqual(['Mozart', 'Haydn']);
		expect(splitList('')).toEqual([]);
		expect(splitList(undefined)).toEqual([]);
	});

	it('saves one way of writing', () => {
		expect(tidyList(' Filmmusik ,Pop;')).toBe('Filmmusik, Pop');
		expect(tidyList('Beethoven')).toBe('Beethoven');
	});

	it('finds a name in a list, ignoring case and accents', () => {
		expect(listHas('Mozart, Haydn', 'haydn')).toBe(true);
		expect(listHas('Dvořák, Smetana', 'Dvorak')).toBe(true);
		expect(listHas('Mozart, Haydn', 'Hay')).toBe(false);
		expect(listHas('Mozart', '')).toBe(false);
	});

	it('tells lists that share a name', () => {
		expect(listsOverlap('Mozart, Haydn', 'Haydn')).toBe(true);
		expect(listsOverlap('Mozart', 'Bach')).toBe(false);
		expect(listsOverlap(undefined, 'Bach')).toBe(false);
	});

	it('collects every name once', () => {
		expect(listItems(['Mozart, Haydn', undefined, 'Haydn', 'Bach'])).toEqual(['Mozart', 'Haydn', 'Bach']);
	});

	it('completes the name being typed after the ones already there', () => {
		const known = ['Mozart', 'Haydn', 'Bach'];
		expect(listCompletions('', known)).toEqual(known);
		expect(listCompletions('Mo', known)).toEqual(known);
		expect(listCompletions('Mozart, Ha', known)).toEqual(['Mozart, Haydn', 'Mozart, Bach']);
		expect(listCompletions('Mozart;Haydn,', known)).toEqual(['Mozart, Haydn, Bach']);
	});
});
