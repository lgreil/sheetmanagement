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
		empty: 'Sobald Google Drive verbunden ist, erscheinen hier alle Stücke aus dem Notenarchiv.'
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
	common: {
		comingSoon: 'Bald verfügbar',
		backHome: 'Zur Übersicht'
	},
	error: {
		title: 'Da ist etwas schiefgelaufen',
		notFound: 'Diese Seite gibt es nicht.'
	}
} as const;
