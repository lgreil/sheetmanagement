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
		noNextConcert: 'Gerade ist kein Konzert im Kalender eingetragen.',
		program: 'Programm',
		nextRehearsal: 'Nächste Probe',
		toConcert: 'Zum Konzert',
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
		noMusic: 'Ohne Noten',
		count: (n: number) => (n === 1 ? '1 Stück' : `${n} Stücke`),
		parts: (n: number) => (n === 1 ? '1 Stimme' : `${n} Stimmen`),
		noResults: 'Nichts gefunden.',
		status: {
			ok: '',
			missing: 'Stimmen fehlen',
			incomplete: 'Unvollständig',
			empty: 'Keine Noten',
			none: 'Nicht im Archiv'
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
		playedAtNone: 'In der Repertoire-Tabelle steht noch kein Konzert mit diesem Stück.',
		playedAtNoSheet: 'Sobald die Repertoire-Tabelle eingerichtet ist, steht hier, in welchen Konzerten dieses Stück gespielt wurde.',
		noMusic: 'Für dieses Stück gibt es keine Noten im Archiv. Es steht nur in der Repertoire-Tabelle.',
		info: {
			arranger: 'Arrangement',
			genre: 'Genre',
			difficulty: 'Schwierigkeit',
			reviewedAt: 'Geprüft am',
			notes: 'Notiz'
		},
		driveHint: 'Die Noten öffnen sich in Google Drive. Dafür brauchst du Zugriff auf den Noten-Ordner.'
	},
	concerts: {
		title: 'Konzerte',
		lead: 'Kommende Konzerte und Proben, direkt aus dem Probenkalender.',
		empty: 'Sobald der Probenkalender verbunden ist, erscheinen hier alle Konzerte und Proben.',
		failed: 'Der Kalender konnte gerade nicht geladen werden. Versuch es gleich noch einmal.',
		upcoming: 'Demnächst',
		past: 'Vergangene Konzerte',
		noUpcoming: 'Gerade stehen keine Termine im Kalender.',
		subscribe: 'Kalender abonnieren',
		filters: { all: 'Alle', concerts: 'Konzerte', rehearsals: 'Proben' },
		types: {
			konzert: 'Konzert',
			generalprobe: 'Generalprobe',
			probe: 'Probe',
			sonstiges: 'Termin'
		},
		tentative: 'noch unsicher',
		allDay: 'ganztägig',
		relative: (days: number) =>
			days === 0 ? 'heute' : days === 1 ? 'morgen' : days > 1 ? `in ${days} Tagen` : days === -1 ? 'gestern' : `vor ${-days} Tagen`,
		forConcert: (title: string) => `für ${title}`
	},
	concert: {
		back: 'Alle Termine',
		when: 'Wann',
		where: 'Wo',
		map: 'Karte',
		openInCalendar: 'Im Google Kalender',
		rehearsals: 'Proben',
		noRehearsals: 'Für dieses Konzert stehen keine Proben im Kalender.',
		program: 'Programm',
		programEmpty: 'Für dieses Konzert ist noch kein Programm eingetragen.',
		programNoSheet: 'Sobald die Repertoire-Tabelle eingerichtet ist, steht hier das Programm mit Links zu den Noten.',
		programHint: 'Das Programm wird in der Repertoire-Tabelle gepflegt, im Blatt „Programm“.',
		notInArchive: 'keine Noten im Archiv',
		archive: 'Aus der Chronik',
		dateUnknown: 'Datum unbekannt',
		preparesFor: 'Probe für',
		description: 'Notiz aus dem Kalender'
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
		setupGuide: 'Anleitung zur Einrichtung',
		setupSheet: 'Tabelle einrichten'
	},
	setup: {
		title: 'Repertoire-Tabelle einrichten',
		lead: 'Legt in der Repertoire-Tabelle die Blätter „Stücke“, „Konzerte“ und „Programm“ mit Überschriften und Auswahllisten an.',
		notConfigured: 'REPERTOIRE_SHEET_ID ist nicht gesetzt. Lege zuerst eine leere Google-Tabelle an und trage ihre ID ein.',
		share: (email: string) => `Teile die Tabelle mit ${email} als Bearbeiter.`,
		failed: 'Auf die Tabelle konnte nicht zugegriffen werden.',
		sheet: 'Tabelle',
		open: 'In Google Sheets öffnen',
		tabs: 'Blätter',
		present: 'vorhanden',
		absent: 'fehlt',
		ready: 'Alles eingerichtet. Neue Stücke aus Drive und Konzerte aus dem Kalender werden automatisch eingetragen.',
		run: 'Jetzt einrichten',
		rerun: 'Formatierung erneuern',
		safe: 'Es werden nur fehlende Blätter und Spalten ergänzt. Vorhandene Einträge bleiben unverändert.',
		done: 'Fertig.',
		created: (tabs: string) => `Angelegt: ${tabs}.`,
		addedColumns: (columns: string) => `Ergänzte Spalten: ${columns}.`,
		removed: (tab: string) => `Das leere Blatt „${tab}“ wurde entfernt.`,
		problems: 'Hinweise zur Tabelle',
		problem: {
			'missing-column': 'Spalte fehlt',
			'duplicate-piece': 'Stück doppelt',
			'duplicate-concert': 'Konzert doppelt',
			'unknown-piece': 'Stück nicht in „Stücke“',
			'unknown-concert': 'Konzert nicht in „Konzerte“',
			'bad-date': 'Datum nicht lesbar'
		},
		row: (n: number) => `Zeile ${n}`,
		counts: (pieces: number, concerts: number, entries: number) =>
			`${pieces} Stücke · ${concerts} Konzerte · ${entries} Programmeinträge`
	},
	/**
	 * Tab and column names of the Repertoire sheet. The app finds columns by these
	 * headers, so columns may be reordered or added in the sheet. Renaming one here
	 * means renaming it in existing sheets too.
	 */
	sheet: {
		pieces: {
			tab: 'Stücke',
			columns: {
				title: 'Titel',
				composer: 'Komponist',
				catalogue: 'Werkverzeichnis',
				arranger: 'Arrangeur',
				genre: 'Genre',
				difficulty: 'Schwierigkeit',
				notes: 'Notiz',
				reviewedAt: 'Geprüft am',
				driveFolderId: 'Drive-Ordner-ID'
			}
		},
		concerts: {
			tab: 'Konzerte',
			columns: {
				date: 'Datum',
				title: 'Anlass',
				location: 'Ort',
				orchestra: 'Orchester',
				eventId: 'Kalender-Event-ID'
			}
		},
		program: {
			tab: 'Programm',
			columns: {
				concert: 'Konzert',
				position: 'Nr.',
				piece: 'Stück',
				notes: 'Notiz'
			}
		}
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
