import { describe, expect, it } from 'vitest';
import { bachkreis } from '#lib/config/presets/bachkreis.ts';
import { parsePieceName, pieceFolderName } from './piece-name.ts';

const parse = (name: string) => parsePieceName(name, bachkreis.naming);

describe('parsePieceName', () => {
	it.each([
		['Bach BWV 147 - Jesu bleibet meine Freude', 'Bach', 'BWV 147', 'Jesu bleibet meine Freude'],
		['Mozart KV 492 - Le nozze di Figaro - Overture', 'Mozart', 'KV 492', 'Le nozze di Figaro - Overture'],
		['Elgar Op. 39 Nr. 1 - Pomp and Circumstance March No. 1', 'Elgar', 'Op. 39 Nr. 1', 'Pomp and Circumstance March No. 1'],
		['Tschaikowsky Op. 71a - Der Nussknacker Suite', 'Tschaikowsky', 'Op. 71a', 'Der Nussknacker Suite'],
		['Charpentier H. 146 - Te Deum', 'Charpentier', 'H. 146', 'Te Deum'],
		['Schubert D. 759 - Sinfonie Nr. 8 Die Unvollendete', 'Schubert', 'D. 759', 'Sinfonie Nr. 8 Die Unvollendete'],
		['Bizet - Carmen', 'Bizet', undefined, 'Carmen'],
		['Andrew Lloyd Webber - Symphonic Reflections', 'Andrew Lloyd Webber', undefined, 'Symphonic Reflections'],
		['Verdi - AIDA - Grand March', 'Verdi', undefined, 'AIDA - Grand March'],
		['Gliere Op. 70 - Russian Sailors Dance', 'Gliere', 'Op. 70', 'Russian Sailors Dance'],
		['Waltz Nr. 2 - Schostakowitsch', 'Schostakowitsch', undefined, 'Waltz Nr. 2'],
		['Star Wars - Main Title', undefined, undefined, 'Star Wars - Main Title'],
		['Superman Returns', undefined, undefined, 'Superman Returns']
	])('%s', (folderName, composer, catalogue, title) => {
		expect(parse(folderName)).toEqual({ composer, catalogue, title });
	});
});

describe('pieceFolderName', () => {
	const name = (piece: Parameters<typeof pieceFolderName>[0]) => pieceFolderName(piece, bachkreis.naming);

	it.each([
		[{ title: 'Jesu bleibet meine Freude', composer: 'Johann Sebastian Bach', catalogue: 'BWV 147' }, 'Bach BWV 147 - Jesu bleibet meine Freude'],
		[{ title: 'Russian Sailors Dance', composer: 'Reinhold Glière', catalogue: 'Op. 70' }, 'Glière Op. 70 - Russian Sailors Dance'],
		[{ title: 'Carmen', composer: 'Bizet' }, 'Bizet - Carmen'],
		[{ title: 'Symphonic Reflections', composer: 'Andrew Lloyd Webber' }, 'Andrew Lloyd Webber - Symphonic Reflections'],
		[{ title: 'Air', catalogue: 'BWV 1068' }, 'BWV 1068 - Air'],
		[{ title: 'Superman Returns', composer: 'John Ottman' }, 'Superman Returns'],
		[{ title: '  AC/DC  Medley ' }, 'AC DC Medley']
	])('%o', (piece, expected) => {
		expect(name(piece)).toBe(expected);
	});

	it('reads back as the same piece', () => {
		const piece = { title: 'Jesu bleibet meine Freude', composer: 'Bach', catalogue: 'BWV 147' };
		expect(parse(name(piece))).toEqual(piece);
	});
});
