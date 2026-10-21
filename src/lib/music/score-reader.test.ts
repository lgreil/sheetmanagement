import { expect, it } from 'vitest';
import { groupLines } from './score-reader.ts';

const item = (str: string, x: number, y: number) => ({ str, transform: [12, 0, 0, 12, x, y] });

it('groups text items into lines, top to bottom and left to right', () => {
	expect(
		groupLines([
			item('Peter Martin', 300, 700),
			item('Arranged by', 200, 701),
			item('Mamma Mia', 250, 760),
			item('  ', 10, 500),
			item('Words and Music by Benny Andersson', 150, 730)
		])
	).toEqual(['Mamma Mia', 'Words and Music by Benny Andersson', 'Arranged by Peter Martin']);
});
