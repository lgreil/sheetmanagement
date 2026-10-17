import type { OrchestraConfig } from '../types.ts';

/**
 * Example preset: a German amateur symphony orchestra whose Drive follows a
 * strict naming convention ("<Titel> - <Stimme>[ - FEHLT].pdf", "@" for scores).
 */
export const bachkreis: OrchestraConfig = {
	name: 'Bachkreis Ehemaligenorchester',
	shortName: 'Bachkreis',
	accent: '#2f6fdb',

	instruments: [
		{ name: 'Partitur', family: 'partitur', aliases: ['Score', 'Direktion', 'Dirigent'] },

		{ name: 'Piccolo', family: 'holz' },
		{ name: 'Flöte', family: 'holz', aliases: ['Floete', 'Flute', 'Querflöte'] },
		{ name: 'Oboe', family: 'holz' },
		{ name: 'Englischhorn', family: 'holz', aliases: ['English Horn'] },
		{ name: 'Klarinette', family: 'holz', aliases: ['Clarinet'] },
		{ name: 'Bassklarinette', family: 'holz', aliases: ['Bass Clarinet'] },
		{ name: 'Fagott', family: 'holz', aliases: ['Bassoon'] },
		{ name: 'Alt-Saxophon', family: 'holz', aliases: ['Altsaxophon', 'Alto Sax'] },
		{ name: 'Tenor-Saxophon', family: 'holz', aliases: ['Tenorsaxophon', 'Tenor Sax'] },
		{ name: 'Holz', family: 'holz' },

		{ name: 'Horn', family: 'blech', aliases: ['Hörner', 'French Horn'] },
		{ name: 'Trompete', family: 'blech', aliases: ['Trompeten', 'Trumpet'] },
		{ name: 'Posaune', family: 'blech', aliases: ['Posaunen', 'Trombone'] },
		{ name: 'Tuba', family: 'blech' },
		{ name: 'Blech', family: 'blech' },

		{ name: 'Pauke', family: 'schlagwerk', aliases: ['Pauken', 'Timpani'] },
		{ name: 'Schlagwerk', family: 'schlagwerk' },
		{ name: 'Percussion', family: 'schlagwerk' },
		{ name: 'Mallet Percussion', family: 'schlagwerk' },

		{ name: 'Cembalo', family: 'tasten', aliases: ['Harpsichord'] },
		{ name: 'Klavier', family: 'tasten', aliases: ['Piano'] },
		{ name: 'Harfe', family: 'tasten', aliases: ['Harp'] },

		{ name: 'C-Stimmen', family: 'sonstige' },
		{ name: 'B-Stimmen', family: 'sonstige' },

		{ name: 'Geige', family: 'streicher', aliases: ['Violine', 'Violin'] },
		{ name: 'Viola', family: 'streicher', aliases: ['Bratsche'] },
		{ name: 'Violoncello', family: 'streicher', aliases: ['Cello'] },
		{ name: 'Kontrabass', family: 'streicher', aliases: ['Bass', 'Double Bass'] }
	],

	naming: {
		separator: ' - ',
		featuredPrefix: '@',
		status: {
			missing: 'FEHLT',
			empty: 'LEER',
			incomplete: 'UNVOLLSTÄNDIG'
		},
		cataloguePatterns: [
			/\bBWV\s*\d+[a-z]?\b/i,
			/\b(?:KV|K\.?)\s*\d+[a-z]?\b/i,
			/\bHob\.?\s*[IVXL]+:\s*\d+\b/i,
			/\bD\.?\s*\d{2,4}\b/,
			/\bOp\.?\s*\d+(?:\s*Nr\.?\s*\d+)?\b/i
		],
		categoryFolderPattern: /^\d+\s*\|\s*(.+)$/
	},

	events: {
		generalprobe: ['generalprobe'],
		probe: ['probe', 'stimmprobe', 'probentag', 'probenwochenende'],
		konzert: ['konzert', 'auftritt', 'matinee', 'serenade']
	}
};
