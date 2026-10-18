/**
 * Privacy notice and terms of use. They describe what this app actually does; if the
 * app changes (new cookies, new services, new data), change these texts too.
 * A template, not legal advice: each orchestra should check it for its own situation.
 */

export interface LegalSection {
	heading: string;
	paragraphs: string[];
	/** Bullet points after the paragraphs. */
	list?: string[];
}

export interface LegalContext {
	/** The orchestra or club, e.g. "Bachkreis Bergkamen". */
	name: string;
}

export const legal = {
	updated: 'Stand: Oktober 2026',
	contactHeading: 'Verantwortlich',
	contactMissing: (settings: string) => `Kontaktangaben fehlen noch (${settings}).`,
	email: 'E-Mail',
	links: {
		privacy: 'Datenschutz',
		terms: 'Nutzungsbedingungen'
	},

	privacy: {
		title: 'Datenschutzerklärung',
		lead: (c: LegalContext) =>
			`${c.name} betreibt diese Web-App für die eigenen Mitglieder: Noten, Konzerte und Programme an einem Ort. Hier steht, welche personenbezogenen Daten dabei verarbeitet werden.`,
		sections: (c: LegalContext): LegalSection[] => [
			{
				heading: 'Anmeldung mit Google',
				paragraphs: [
					'Zum Anmelden leitet die App zu Google weiter. Nach der Anmeldung erhält die App von Google deinen Namen und deine bestätigte E-Mail-Adresse. Die App erhält kein Passwort und keinen Zugriff auf Inhalte deines Google-Kontos.',
					`Damit prüft die App, ob du Mitglied des Orchesters bist und was du in der App tun darfst. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Mitgliedschaft) und lit. f DSGVO (berechtigtes Interesse an einem geschützten Zugang).`
				]
			},
			{
				heading: 'Mitgliederliste',
				paragraphs: [
					`Für die Zugangsverwaltung gibt es eine Mitgliederliste in einer Google-Tabelle des Orchesters. Sie wird von Personen gepflegt, die Mitglieder freischalten dürfen (z. B. dem Vorstand).`
				],
				list: [
					'Mitglieder: E-Mail-Adresse, Name, Instrument, Gruppen (z. B. „Vorstand“) und vergebene Rechte',
					'Zugangsanfragen: E-Mail-Adresse, Name und Datum der Anfrage. Sie werden gelöscht, sobald über die Anfrage entschieden ist.',
					'Mitgliedsdaten werden gelöscht, wenn du austrittst oder es verlangst.'
				]
			},
			{
				heading: 'Meldungen und Wünsche',
				paragraphs: [
					`Wenn du ein Problem mit Noten meldest oder einen Wunsch einträgst, speichert die App deinen Text zusammen mit deinem Namen, deiner E-Mail-Adresse und dem Datum in der Google-Tabelle des Orchesters. Gibst du einem Wunsch ein „+1“, wird deine E-Mail-Adresse beim Wunsch gespeichert, damit jede Person nur einmal zählt.`,
					`Alle Mitglieder sehen Meldungen und Wünsche, aber nicht, von wem sie stammen und wer „+1“ gegeben hat. Das sehen nur die Personen, die Meldungen bearbeiten oder Mitglieder verwalten dürfen, damit sie nachfragen können. Meldungen zu einer Datei können zusätzlich als Kommentar an der Datei in Google Drive erscheinen, ohne deinen Namen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, die Noten und die App gemeinsam zu verbessern). Auf Wunsch werden deine Einträge gelöscht.`
				]
			},
			{
				heading: 'Cookies und Speicher im Browser',
				paragraphs: [
					'Die App nutzt nur technisch notwendige Cookies, keine Analyse-, Tracking- oder Werbe-Cookies. Dafür ist keine Einwilligung nötig (§ 25 Abs. 2 Nr. 2 TDDDG).'
				],
				list: [
					'„session“: hält dich angemeldet. Enthält deinen Namen und deine E-Mail-Adresse, ist gegen Veränderung gesichert und läuft nach 30 Tagen ab, beim Abmelden sofort.',
					'„oauth_state“: schützt die Anmeldung vor Missbrauch und wird nach höchstens 10 Minuten gelöscht.',
					'Im Speicher deines Browsers (localStorage) merkt sich die App, ob du das helle oder dunkle Farbschema gewählt hast. Diese Angabe verlässt deinen Browser nicht.'
				]
			},
			{
				heading: 'Hosting bei Cloudflare',
				paragraphs: [
					'Die App läuft bei Cloudflare (Cloudflare, Inc., USA, mit Rechenzentren weltweit). Bei jedem Aufruf werden technisch deine IP-Adresse, der Zeitpunkt und die aufgerufene Adresse verarbeitet, um die Seite auszuliefern und vor Angriffen zu schützen (Art. 6 Abs. 1 lit. f DSGVO). Cloudflare ist nach dem EU-US Data Privacy Framework zertifiziert.'
				]
			},
			{
				heading: 'Noten, Termine und Tabelle bei Google',
				paragraphs: [
					`Noten, Probentermine und die Repertoire-Tabelle liegen in Google Drive, Google Kalender und Google Tabellen des Orchesters. Die App liest sie über ein eigenes technisches Konto. Wenn du Noten öffnest, öffnen sie sich direkt bei Google, angemeldet mit deinem eigenen Google-Konto. Dafür gilt die Datenschutzerklärung von Google (policies.google.com/privacy). Google ist nach dem EU-US Data Privacy Framework zertifiziert.`
				]
			},
			{
				heading: 'Deine Rechte',
				paragraphs: [
					'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit sowie das Recht, der Verarbeitung zu widersprechen (Art. 15 bis 21 DSGVO). Wende dich dafür an die oben genannte Kontaktadresse.',
					'Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO), zum Beispiel bei der deines Bundeslandes.'
				]
			}
		]
	},

	terms: {
		title: 'Nutzungsbedingungen',
		lead: (c: LegalContext) => `${c.name} stellt diese Web-App den eigenen Mitgliedern kostenlos zur Verfügung.`,
		sections: (c: LegalContext): LegalSection[] => [
			{
				heading: 'Wer die App nutzen darf',
				paragraphs: [
					`Die App ist nur für Mitglieder des Orchesters. Den Zugang schalten die dafür zuständigen Personen frei. Melde dich nur mit deinem eigenen Google-Konto an und gib deinen Zugang nicht weiter.`
				]
			},
			{
				heading: 'Noten und Urheberrecht',
				paragraphs: [
					`Viele Noten sind urheberrechtlich geschützt oder nur für das Orchester lizenziert. Nutze sie nur für Proben und Auftritte des Orchesters und für das Üben dafür.`
				],
				list: [
					'Gib Noten nicht an Personen außerhalb des Orchesters weiter.',
					'Veröffentliche oder teile sie nicht im Internet, auch nicht in Messengern oder sozialen Netzwerken.'
				]
			},
			{
				heading: 'Inhalte',
				paragraphs: [
					'Programme, Termine und Angaben zu Stücken werden von Mitgliedern gepflegt und können Fehler enthalten. Verbindlich sind die Absprachen der musikalischen Leitung und des Vorstands.'
				]
			},
			{
				heading: 'Verfügbarkeit und Änderungen',
				paragraphs: [
					'Es besteht kein Anspruch darauf, dass die App jederzeit erreichbar ist. Sie kann geändert oder eingestellt werden. Der Zugang endet mit dem Austritt aus dem Orchester und kann bei Verstößen gegen diese Bedingungen entzogen werden.'
				]
			}
		]
	}
};
