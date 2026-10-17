import type { OrchestraConfig } from '../types.ts';

/**
 * Example preset: a German amateur symphony orchestra whose Drive follows a naming
 * convention ("<Titel> - <Stimme>[ - FEHLT].pdf", "@" for scores) but still holds many
 * older files with English or abbreviated names ("Best_of_Bach-ViolinII.pdf").
 */
export const bachkreis: OrchestraConfig = {
	name: 'Bachkreis Ehemaligenorchester',
	shortName: 'Bachkreis',
	accent: '#2f6fdb',
	timeZone: 'Europe/Berlin',
	locale: 'de-DE',

	instruments: [
		{ name: 'Partitur', family: 'partitur', aliases: ['Score', 'Full Score', 'Direktion', 'Dirigent', 'Conductor', 'Gesamtausgabe', 'Gesammtausgabe', 'Ges', 'Full Orchestra'] },

		{ name: 'Blockflöte', family: 'holz', aliases: ['Recorder', 'Recorders'] },
		{ name: 'Tenor-Blockflöte', family: 'holz', aliases: ['Tenorblockflöte', 'Tenor Recorder'] },
		{ name: 'Piccolo', family: 'holz', aliases: ['Piccoloflöte', 'Picc'] },
		{ name: 'Flöte', family: 'holz', aliases: ['Flöten', 'Querflöte', 'Floete', 'Flute', 'Flutes'] },
		{ name: 'Oboe', family: 'holz', aliases: ['Oboen', 'Oboes'] },
		{ name: 'Englischhorn', family: 'holz', aliases: ['English Horn', 'Cor Anglais'] },
		{ name: 'Klarinette', family: 'holz', aliases: ['Klarinetten', 'Clarinet', 'Clarinets', 'Clarinette', 'Clarinettes', 'Clarinett', 'Calarinet', 'Clari'] },
		{ name: 'Bassklarinette', family: 'holz', aliases: ['Bass Clarinet', 'Bass Clari'] },
		{ name: 'Fagott', family: 'holz', aliases: ['Fagotte', 'Bassoon', 'Bassoons', 'Bassoonpdf', 'Basson', 'Bassons'] },
		{ name: 'Sopran-Saxophon', family: 'holz', aliases: ['Sopransaxophon', 'Soprano Sax'] },
		{ name: 'Alt-Saxophon', family: 'holz', aliases: ['Altsaxophon', 'Alt Sax', 'Alto Sax', 'Alto Saxophone', 'Altsax', 'Alt Saxphone'] },
		{ name: 'Tenor-Saxophon', family: 'holz', aliases: ['Tenorsaxophon', 'Tenor Sax', 'Tenor Saxophone', 'Tenorsax'] },
		{ name: 'Bariton-Saxophon', family: 'holz', aliases: ['Baritonsaxophon', 'Bari Sax', 'Baritone Sax'] },
		{ name: 'Saxophon', family: 'holz', aliases: ['Sax', 'Saxophone', 'Saxphone'] },
		{ name: 'Holz', family: 'holz', aliases: ['Holzbläser', 'Woodwinds'] },

		{ name: 'Horn', family: 'blech', aliases: ['Hörner', 'Waldhorn', 'French Horn', 'Horns'] },
		{ name: 'Trompete', family: 'blech', aliases: ['Trompeten', 'Trumpet', 'Trumpets'] },
		{ name: 'Posaune', family: 'blech', aliases: ['Posaunen', 'Trombone', 'Trombones', 'Tombone', 'Pos'] },
		{ name: 'Bassposaune', family: 'blech', aliases: ['Bass Trombone'] },
		{ name: 'Bariton', family: 'blech', aliases: ['Baritone', 'Euphonium'] },
		{ name: 'Tuba', family: 'blech', aliases: ['Basstuba'] },
		{ name: 'Blech', family: 'blech', aliases: ['Blechbläser', 'Brass'] },

		{ name: 'Pauke', family: 'schlagwerk', aliases: ['Pauken', 'Timpani', 'Timp'] },
		{ name: 'Schlagwerk', family: 'schlagwerk', aliases: ['Schlagzeug', 'Drum Set', 'Drumset', 'Drums'] },
		{ name: 'Percussion', family: 'schlagwerk', aliases: ['Perc'] },
		{ name: 'Mallet Percussion', family: 'schlagwerk', aliases: ['Mallets'] },
		{ name: 'Glockenspiel', family: 'schlagwerk', aliases: ['Bells'] },
		{ name: 'Xylophon', family: 'schlagwerk', aliases: ['Xylophone'] },
		{ name: 'Becken', family: 'schlagwerk', aliases: ['Cymbals'] },
		{ name: 'Große Trommel', family: 'schlagwerk', aliases: ['Gran Cassa', 'Bass Drum'] },
		{ name: 'Trommel', family: 'schlagwerk', aliases: ['Kleine Trommel', 'Snare Drum', 'Snare'] },
		{ name: 'Tamburin', family: 'schlagwerk', aliases: ['Tambourine'] },
		{ name: 'Tamtam', family: 'schlagwerk', aliases: ['Tam Tam', 'Gong'] },

		{ name: 'Cembalo', family: 'tasten', aliases: ['Harpsichord'] },
		{ name: 'Klavier', family: 'tasten', aliases: ['Piano'] },
		{ name: 'Orgel', family: 'tasten', aliases: ['Organ'] },
		{ name: 'Synthesizer', family: 'tasten', aliases: ['Synth', 'Keyboard', 'Roland'] },
		{ name: 'Harfe', family: 'tasten', aliases: ['Harp'] },
		{ name: 'Continuo', family: 'tasten', aliases: ['Basso Continuo'] },

		{ name: 'Sopran', family: 'gesang', aliases: ['Soprano'] },
		{ name: 'Chor', family: 'gesang', aliases: ['SATB', 'Choir'] },
		{ name: 'Gesang', family: 'gesang', aliases: ['Vocals', 'Vocal'] },

		{ name: 'C-Stimmen', family: 'sonstige' },
		{ name: 'B-Stimmen', family: 'sonstige' },
		{ name: 'Es-Stimmen', family: 'sonstige' },
		{ name: 'F-Stimmen', family: 'sonstige' },
		{ name: 'Stimme', family: 'sonstige', aliases: ['Part'], voice: true },

		{ name: 'Geige', family: 'streicher', aliases: ['Geigen', 'Violine', 'Violinen', 'Violin', 'Violins'] },
		{ name: 'Viola', family: 'streicher', aliases: ['Violen', 'Bratsche', 'Violas', 'Vioa'] },
		{ name: 'Violoncello', family: 'streicher', aliases: ['Cello', 'Celli', 'Cellos', 'Violoncellos'] },
		{
			name: 'Kontrabass',
			family: 'streicher',
			aliases: ['Kontrabässe', 'Contrabass', 'Contrabasses', 'Double Bass', 'String Bass', 'Stringbass', 'Bass']
		}
	],

	naming: {
		separator: ' - ',
		featuredPrefix: '@',
		status: {
			missing: 'FEHLT',
			empty: 'LEER',
			incomplete: 'UNVOLLSTÄNDIG'
		},
		statusAliases: { incomplete: 'incomplete', incomp: 'incomplete', unvollstaendig: 'incomplete' },
		cataloguePatterns: [
			/\bBWV\s*\d+[a-z]?\b/i,
			/\bHWV\s*\d+[a-z]?\b/i,
			/\b(?:KV|K\.)\s*\d+[a-z]?\b/i,
			/\bRV\s*\d+[a-z]?\b/i,
			/\bTH\s*\d+[a-z]?\b/,
			/\bHob\.?\s*[IVXL]+:\s*\d+\b/i,
			/\bH\.\s*\d+[a-z]?\b/,
			/\bD\.\s*\d{2,4}\b/,
			/\bOp\.?\s*\d+[a-z]?(?:\s*Nr\.?\s*\d+)?\b/i
		],
		categoryFolderPattern: /^\d+\s*\|\s*(.+)$/,
		knownComposers: [
			'Andrew Lloyd Webber',
			'Anderson',
			'Bach',
			'Beethoven',
			'Bizet',
			'Brahms',
			'Charpentier',
			'Dvorak',
			'Dvořák',
			'Elgar',
			'Faure',
			'Fauré',
			'Gershwin',
			'Gliere',
			'Grieg',
			'Händel',
			'Haydn',
			'Holst',
			'Jenkins',
			'Lumbye',
			'Mendelssohn',
			'Mozart',
			'Mussorgsky',
			'Offenbach',
			'Purcell',
			'Rossini',
			'Schostakowitsch',
			'Schubert',
			'Schumann',
			'Smetana',
			'Strauss',
			'Telemann',
			'Tschaikowsky',
			'Verdi',
			'Vivaldi',
			'Wagner'
		],
		transpositions: {
			b: 'B',
			bb: 'B',
			es: 'Es',
			eb: 'Es',
			f: 'F',
			a: 'A',
			c: 'C',
			d: 'D',
			'hoch b': 'hoch B'
		},
		partNotes: {
			vereinfacht: 'vereinfacht',
			easy: 'vereinfacht',
			duplikat: 'Duplikat',
			solo: 'Solo',
			notizen: 'mit Notizen',
			zusatzstimmen: 'Zusatzstimmen',
			fassung: 'Fassung',
			'bass fassung': 'Bass-Fassung'
		},
		movementNote: 'Satz'
	},

	events: {
		generalprobe: ['generalprobe'],
		probe: ['probe', 'stimmprobe', 'probentag', 'probenwochenende'],
		konzert: ['konzert', 'auftritt', 'matinee', 'serenade']
	}
};
