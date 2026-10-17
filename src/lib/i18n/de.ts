/** All user-facing texts. To translate the app, copy this file and change the strings. */
export const de = {
	nav: {
		home: 'Übersicht',
		pieces: 'Stücke',
		concerts: 'Konzerte',
		myParts: 'Meine Noten'
	},
	theme: {
		label: 'Farbschema',
		system: 'System',
		light: 'Hell',
		dark: 'Dunkel'
	},
	home: {
		greeting: 'Willkommen',
		intro: 'Noten, Konzerte und Programme an einem Ort, direkt aus Google Drive und dem Probenkalender.',
		nextConcert: 'Nächstes Konzert',
		nextConcertEmpty: 'Sobald der Kalender verbunden ist, steht hier das nächste Konzert mit Programm.',
		quickLinks: 'Schnellzugriff'
	},
	pieces: {
		title: 'Stücke',
		lead: 'Das komplette Notenarchiv mit allen Stimmen.',
		empty: 'Sobald Google Drive verbunden ist, erscheinen hier alle Stücke aus dem Notenarchiv.',
		failed: 'Das Notenarchiv konnte gerade nicht geladen werden. Versuch es gleich noch einmal.',
		checkStatus: 'Verbindung prüfen',
		search: 'Titel, Komponist oder BWV …',
		all: 'Alle',
		archive: 'Archiv',
		needsWork: 'Mit Lücken',
		count: (n: number) => (n === 1 ? '1 Stück' : `${n} Stücke`),
		parts: (n: number) => (n === 1 ? '1 Stimme' : `${n} Stimmen`),
		noResults: 'Nichts gefunden.',
		status: {
			ok: '',
			missing: 'Stimmen fehlen',
			incomplete: 'Unvollständig',
			empty: 'Keine Noten'
		}
	},
	piece: {
		back: 'Alle Stücke',
		openFolder: 'Ordner in Google Drive',
		groups: {
			featured: 'Partitur & Solo',
			holz: 'Holzbläser',
			blech: 'Blechbläser',
			schlagwerk: 'Schlagwerk',
			tasten: 'Tasten & Harfe',
			gesang: 'Gesang',
			streicher: 'Streicher',
			sonstige: 'Stimmen für alle',
			other: 'Weitere Dateien'
		},
		partStatus: {
			ok: '',
			missing: 'fehlt',
			empty: 'leer',
			incomplete: 'unvollständig'
		},
		missingSummary: (n: number) =>
			n === 1 ? '1 Stimme fehlt oder ist unvollständig.' : `${n} Stimmen fehlen oder sind unvollständig.`,
		playedAt: 'Gespielt bei',
		playedAtSoon: 'Hier steht bald, in welchen Konzerten dieses Stück gespielt wurde.',
		driveHint: 'Die Noten öffnen sich in Google Drive. Dafür brauchst du Zugriff auf den Noten-Ordner.'
	},
	concerts: {
		title: 'Konzerte',
		lead: 'Kommende und vergangene Konzerte mit Programm.',
		empty: 'Sobald der Probenkalender verbunden ist, erscheinen hier alle Konzerte und Proben.'
	},
	myParts: {
		title: 'Meine Noten',
		lead: 'Deine Stimmen für das nächste Konzert, in Programmreihenfolge.',
		empty: 'Nach der Anmeldung findest du hier deine Stimmen für jedes Konzert.'
	},
	status: {
		title: 'Status',
		lead: 'Ob die Verbindung zu Google funktioniert. Hilfreich beim Einrichten.',
		account: 'Google-Dienstkonto',
		drive: 'Notenarchiv (Google Drive)',
		calendar: 'Probenkalender (Google Calendar)',
		sheet: 'Repertoire-Tabelle (Google Sheets)',
		ok: 'Verbunden',
		error: 'Fehler',
		missing: 'Nicht eingerichtet',
		refresh: 'Archiv neu einlesen',
		setupGuide: 'Anleitung zur Einrichtung'
	},
	common: {
		comingSoon: 'Bald verfügbar',
		backHome: 'Zur Übersicht'
	},
	error: {
		title: 'Da ist etwas schiefgelaufen',
		notFound: 'Diese Seite gibt es nicht.'
	}
} as const;
