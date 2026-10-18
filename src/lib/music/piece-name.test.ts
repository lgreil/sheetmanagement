import { describe, expect, it } from 'vitest';
import { bachkreis } from '#lib/config/presets/bachkreis.ts';
import { parsePieceName } from './piece-name.ts';

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
