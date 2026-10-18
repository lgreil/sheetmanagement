import { legal } from './legal.de.ts';

/** All user-facing texts. To translate the app, copy this file and change the strings. */
export const de = {
	nav: {
		home: 'Übersicht',
		pieces: 'Stücke',
		concerts: 'Konzerte',
		myParts: 'Meine Noten',
		wishes: 'Wünsche',
		reports: 'Meldungen',
		admin: 'Verwaltung'
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
		needsWork: 'Mit Lücken',
		noMusic: 'Ohne Noten',
		byComposer: (composer: string) => `Werke von ${composer}`,
		clearComposer: 'Komponisten-Filter entfernen',
		categoryFiles: 'Dateien zu dieser Kategorie',
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
		sections: 'Fassungen',
		playedBadge: 'gespielt',
		sectionHint: {
			played: 'Die Stimmen, die gespielt werden.',
			complete: 'Das komplette Werk, zum Nachschlagen.',
			movement: '',
			other: ''
		},
		sectionFolder: 'Diesen Ordner in Google Drive',
		otherVersions: 'Weitere Fassungen dieses Werks',
		moreBy: (composer: string) => `Weitere Werke von ${composer}`,
		allBy: (composer: string) => `Alle Werke von ${composer}`,
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
	gaps: {
		title: 'Fehlende Stimmen',
		lead: 'Alle Lücken im Notenarchiv, aus den Dateinamen (FEHLT, LEER, UNVOLLSTÄNDIG) und den offenen Meldungen. Ersetzt die Listen in Drive.',
		all: 'Alle',
		current: 'Aktuelle Programme',
		counts: { missing: 'fehlen', empty: 'leer', incomplete: 'unvollständig', reports: 'Meldungen' },
		reported: 'Gemeldet',
		none: 'Keine Lücken im Archiv.',
		noneHere: 'In dieser Auswahl gibt es keine Lücken.',
		failed: 'Das Notenarchiv konnte gerade nicht geladen werden.',
		manage: 'Meldungen bearbeiten',
		link: 'Alle fehlenden Stimmen',
		done: 'erledigt',
		doneHint: 'Im Blatt „Fehlende Stimmen“ abgehakt. Die Lücke verschwindet, sobald die Datei umbenannt ist.'
	},
	instrumentation: {
		title: 'Besetzung',
		lead: 'Welche Stimmen für dieses Programm da sind. Lücken fallen so vor der ersten Probe auf.',
		onlyPlayed: 'Nur Instrumente der Mitglieder',
		piece: 'Stück',
		legend: {
			own: 'Stimme da',
			shared: 'Gemeinsame Stimme',
			problem: 'Fehlt, leer oder unvollständig',
			none: 'Keine Stimme'
		},
		noMusic: 'keine Noten',
		gaps: (n: number) => (n === 1 ? '1 Lücke bei Instrumenten der Mitglieder' : `${n} Lücken bei Instrumenten der Mitglieder`)
	},
	myParts: {
		title: 'Meine Noten',
		lead: 'Deine Stimmen für das nächste Konzert, in Programmreihenfolge.',
		empty: 'Nach der Anmeldung findest du hier deine Stimmen für jedes Konzert.',
		forConcert: (concert: string) => `Meine Noten fürs ${concert}`,
		concert: 'Konzert',
		instrument: 'Instrument',
		number: 'Stimme',
		anyNumber: 'alle',
		pickInstrument: 'Was spielst du? Einmal auswählen, dann sind deine Noten immer hier.',
		unknownInstrument: (text: string) => `„${text}“ kennt die App nicht als Instrument. Bitte einmal auswählen.`,
		save: 'Merken',
		saved: 'Gemerkt.',
		change: 'Ändern',
		show: 'Anzeigen',
		noConcert: 'Gerade steht kein Konzert mit Programm an.',
		noProgram: 'Für dieses Konzert ist noch kein Programm eingetragen.',
		shared: 'Gemeinsame Stimme',
		noPart: (instrument: string) => `Keine Stimme für ${instrument}`,
		noMusic: 'Keine Noten im Archiv',
		missing: 'fehlt im Archiv',
		summary: (found: number, total: number) => `${found} von ${total} Stücken mit Stimme`,
		merge: 'Als eine PDF',
		merging: (done: number, total: number) => `Lade Stimme ${done} von ${total} …`,
		mergeFailed: 'Die PDF konnte nicht erstellt werden. Die einzelnen Stimmen lassen sich weiter öffnen.',
		mergeHint: 'Fügt deine Stimmen in Programmreihenfolge zu einer Datei zusammen, zum Drucken oder fürs Tablet.',
		mergeOff: 'Das Zusammenfügen geht nur mit Anmeldung.',
		fileName: (concert: string, instrument: string) => `Meine Noten – ${concert} – ${instrument}.pdf`
	},
	auth: {
		title: 'Anmelden',
		lead: 'Melde dich mit deinem Google-Konto an, um Noten, Konzerte und Programme zu sehen.',
		button: 'Mit Google anmelden',
		privacy: 'Die App erfährt dabei nur deinen Namen und deine E-Mail-Adresse.',
		notReady: 'Die Anmeldung ist noch nicht fertig eingerichtet:',
		errors: {
			abgebrochen: 'Die Anmeldung wurde abgebrochen.',
			abgelaufen: 'Die Anmeldung ist abgelaufen. Bitte versuch es noch einmal.',
			konto: 'Dieses Google-Konto hat keine bestätigte E-Mail-Adresse.',
			google: 'Google hat die Anmeldung gerade nicht bestätigt. Bitte versuch es noch einmal.'
		} as Record<string, string>,
		signedInAs: (email: string) => `Angemeldet als ${email}`,
		logout: 'Abmelden',
		switchAccount: 'Mit einem anderen Konto anmelden'
	},
	access: {
		title: 'Zugang beantragen',
		hello: (name: string) => `Hallo ${name}!`,
		lead: 'Du bist angemeldet, aber noch nicht als Mitglied freigeschaltet.',
		request: 'Zugang beantragen',
		requested: 'Deine Anfrage ist angekommen. Sobald sie bestätigt ist, kannst du die App nutzen. Lade die Seite dann neu.',
		unavailable: 'Anfragen sind gerade nicht möglich. Bitte melde dich direkt beim Vorstand.'
	},
	rights: {
		ansehen: 'Stücke, Konzerte und Noten ansehen (hat jedes Mitglied)',
		'programme.bearbeiten': 'Konzertprogramme bearbeiten',
		'stuecke.bearbeiten': 'Angaben zu Stücken bearbeiten',
		'archiv.bearbeiten': 'Frühere Konzerte und Stücke eintragen',
		'mitglieder.verwalten': 'Mitglieder und Rechte verwalten'
	},
	admin: {
		title: 'Verwaltung',
		lead: 'Mitglieder freischalten und Rechte vergeben. Alles steht auch in der Repertoire-Tabelle.',
		openSheet: 'Tabelle öffnen',
		notSetUp: 'In der Repertoire-Tabelle fehlen die Blätter für Mitglieder und Rechte.',
		runSetup: 'Tabelle einrichten',
		requests: 'Zugangsanfragen',
		noRequests: 'Keine offenen Anfragen.',
		approve: 'Freischalten',
		decline: 'Ablehnen',
		members: 'Mitglieder',
		noMembers: 'Noch keine Mitglieder eingetragen.',
		addMember: 'Mitglied hinzufügen',
		email: 'E-Mail',
		name: 'Name',
		instrument: 'Instrument',
		groups: 'Gruppen',
		groupsHint: 'mehrere mit Komma trennen',
		add: 'Hinzufügen',
		remove: 'Entfernen',
		confirmRemove: (name: string) => `${name} wirklich entfernen?`,
		rightsTitle: 'Rechte',
		rightsLead: 'Rechte gelten für eine E-Mail-Adresse oder eine Gruppe.',
		who: 'Wer',
		right: 'Recht',
		grant: 'Vergeben',
		revoke: 'Entziehen',
		noGrants: 'Noch keine Rechte vergeben. Bootstrap-Admins haben immer alle Rechte.',
		bootstrap: (emails: string) => `Immer alle Rechte (BOOTSTRAP_ADMINS): ${emails}`,
		saved: 'Gespeichert.',
		invalidEmail: 'Bitte eine gültige E-Mail-Adresse eingeben.',
		exists: 'Diese E-Mail-Adresse ist schon eingetragen.',
		grantExists: 'Dieses Recht ist schon vergeben.'
	},
	editor: {
		edit: 'Programm bearbeiten',
		title: (concert: string) => `Programm: ${concert}`,
		lead: 'Stücke hinzufügen, sortieren und speichern. Das Programm landet im Blatt „Programm“ der Repertoire-Tabelle.',
		search: 'Stück suchen und hinzufügen …',
		empty: 'Noch keine Stücke im Programm.',
		noteLabel: 'Notiz',
		notePlaceholder: 'z. B. Zugabe',
		up: 'Nach oben',
		down: 'Nach unten',
		remove: 'Entfernen',
		save: 'Speichern',
		cancel: 'Abbrechen',
		saved: 'Programm gespeichert.',
		conflict: 'Jemand hat das Programm inzwischen geändert. Lade die Seite neu und mach deine Änderung noch einmal.',
		notInSheet: 'Dieses Konzert steht noch nicht in der Repertoire-Tabelle. Bestätigte Konzerte aus dem Kalender werden automatisch eingetragen, unsichere („(?)“) erst später.',
		noResults: 'Kein Stück gefunden.'
	},
	status: {
		title: 'Status',
		lead: 'Ob die Verbindung zu Google funktioniert. Hilfreich beim Einrichten.',
		account: 'Google-Dienstkonto',
		drive: 'Notenarchiv (Google Drive)',
		calendar: 'Probenkalender (Google Calendar)',
		sheet: 'Repertoire-Tabelle (Google Sheets)',
		signIn: 'Anmeldung (Google)',
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
			'bad-date': 'Datum nicht lesbar',
			'duplicate-member': 'Mitglied doppelt',
			'unknown-right': 'Unbekanntes Recht'
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
		},
		members: {
			tab: 'Mitglieder',
			columns: {
				email: 'E-Mail',
				name: 'Name',
				instrument: 'Instrument',
				groups: 'Gruppen'
			}
		},
		groups: {
			tab: 'Gruppen',
			columns: {
				name: 'Gruppe',
				description: 'Beschreibung'
			}
		},
		rights: {
			tab: 'Rechte',
			columns: {
				who: 'Wer',
				right: 'Recht'
			}
		},
		requests: {
			tab: 'Zugangsanfragen',
			columns: {
				email: 'E-Mail',
				name: 'Name',
				requestedAt: 'Angefragt am'
			}
		},
		reports: {
			tab: 'Meldungen',
			columns: {
				piece: 'Stück',
				pieceId: 'Drive-Ordner-ID',
				part: 'Stimme',
				fileId: 'Datei-ID',
				kind: 'Art',
				comment: 'Kommentar',
				status: 'Status',
				note: 'Notiz',
				reportedBy: 'Gemeldet von',
				reportedAt: 'Gemeldet am',
				id: 'Meldungs-ID'
			}
		},
		wishes: {
			tab: 'Wünsche',
			columns: {
				kind: 'Art',
				title: 'Titel',
				composer: 'Komponist',
				link: 'Link',
				description: 'Beschreibung',
				status: 'Status',
				answer: 'Antwort',
				submittedBy: 'Eingereicht von',
				submittedAt: 'Datum',
				votes: '+1',
				id: 'Wunsch-ID'
			}
		},
		/** Generated from the archive's file names; the app rewrites it, people only tick "erledigt". */
		missingParts: {
			tab: 'Fehlende Stimmen',
			columns: {
				piece: 'Stück',
				part: 'Stimme',
				status: 'Status',
				fileId: 'Datei-ID',
				done: 'erledigt'
			}
		}
	},
	/** Values of the dropdown columns in "Meldungen" and "Wünsche", as they appear in the sheet. */
	feedbackValues: {
		reportKind: {
			missing: 'Stimme fehlt',
			scan: 'Schlechter Scan',
			pages: 'Seiten fehlen',
			wrong: 'Falsche Stimme',
			other: 'Sonstiges'
		},
		reportStatus: { open: 'offen', done: 'erledigt' },
		wishKind: { piece: 'Stück', feature: 'Funktion' },
		wishStatus: { open: 'offen', planned: 'geplant', done: 'erledigt', declined: 'abgelehnt' }
	},
	reports: {
		report: 'Problem melden',
		reportPart: (part: string) => `Problem mit „${part}“ melden`,
		lead: 'Stimme fehlt, Scan unleserlich, Seiten fehlen? Kurz melden, dann kümmert sich jemand darum.',
		part: 'Was ist betroffen?',
		wholePiece: 'Ganzes Stück',
		kind: 'Art des Problems',
		comment: 'Kommentar (optional)',
		commentHint: 'z. B. „Seite 3 fehlt“',
		send: 'Melden',
		cancel: 'Abbrechen',
		thanks: 'Danke! Die Meldung ist eingegangen.',
		known: 'Bekannte Probleme',
		failed: 'Die Meldung konnte gerade nicht gespeichert werden. Bitte versuch es noch einmal.',
		notSetUp: 'Meldungen sind noch nicht eingerichtet: Auf der Seite „Tabelle einrichten“ wird das Blatt „Meldungen“ angelegt.',
		signInNeeded: 'Zum Melden bitte anmelden.',
		title: 'Meldungen',
		short: 'Probleme mit Noten, die Mitglieder gemeldet haben.',
		pageLead: 'Probleme mit Noten, die Mitglieder gemeldet haben. Erledigte verschwinden von der Stückseite.',
		open: 'Offen',
		done: 'Erledigt',
		noOpen: 'Keine offenen Meldungen.',
		noDone: 'Noch nichts erledigt.',
		close: 'Erledigt',
		reopen: 'Wieder öffnen',
		note: 'Notiz (optional)',
		noteHint: 'z. B. „neu gescannt“',
		by: (name: string, date: string) => `${name} · ${date}`,
		toPiece: 'Zum Stück',
		openCount: (n: number) => (n === 1 ? '1 offene Meldung' : `${n} offene Meldungen`),
		gone: 'Diese Meldung gibt es nicht mehr.',
		unknownPart: 'Diese Stimme gibt es in dem Stück nicht.'
	},
	wishes: {
		title: 'Wünsche',
		lead: 'Stücke, die wir spielen, bestellen oder digitalisieren sollten, und Ideen für die App.',
		tabs: { piece: 'Stückwünsche', feature: 'Funktionswünsche' },
		add: { piece: 'Stück vorschlagen', feature: 'Idee vorschlagen' },
		titleLabel: 'Titel',
		composer: 'Komponist (optional)',
		link: 'Link (optional)',
		linkHint: 'z. B. eine Aufnahme oder der Verlag',
		why: 'Warum? (optional)',
		description: 'Was soll die App können?',
		send: 'Wunsch abschicken',
		thanks: 'Danke! Dein Wunsch steht jetzt auf der Liste.',
		empty: { piece: 'Noch keine Stückwünsche.', feature: 'Noch keine Funktionswünsche.' },
		vote: 'Finde ich auch',
		unvote: 'Doch nicht',
		votes: (n: number) => `+${n}`,
		answer: 'Antwort',
		status: 'Status',
		setStatus: 'Speichern',
		submittedBy: (name: string, date: string) => `Von ${name} · ${date}`,
		invalidLink: 'Der Link muss mit http:// oder https:// beginnen.',
		titleMissing: 'Bitte einen Titel angeben.',
		descriptionMissing: 'Bitte beschreiben, was die App können soll.',
		failed: 'Das konnte gerade nicht gespeichert werden. Bitte versuch es noch einmal.',
		notSetUp: 'Wünsche sind noch nicht eingerichtet: Auf der Seite „Tabelle einrichten“ wird das Blatt „Wünsche“ angelegt.',
		signInNeeded: 'Wünsche brauchen eine Anmeldung, damit jede Person nur einmal „+1“ geben kann.',
		gone: 'Diesen Wunsch gibt es nicht mehr.',
		toPiece: 'Im Archiv'
	},
	legal,
	common: {
		comingSoon: 'Bald verfügbar',
		backHome: 'Zur Übersicht'
	},
	error: {
		title: 'Da ist etwas schiefgelaufen',
		notFound: 'Diese Seite gibt es nicht.'
	}
} as const;
