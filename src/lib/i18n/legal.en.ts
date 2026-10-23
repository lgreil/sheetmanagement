import type { LegalContext, LegalSection } from './legal.de.ts';

/**
 * Privacy notice and terms of use in English (#124), describing the same app as legal.de.ts.
 * A template, not legal advice: each orchestra should check it for its own situation and country.
 */
export const legal = {
	updated: 'As of October 2026',
	contactHeading: 'Responsible',
	contactMissing: (settings: string) => `Contact details are still missing (${settings}).`,
	email: 'Email',
	links: {
		privacy: 'Privacy',
		terms: 'Terms of use'
	},

	privacy: {
		title: 'Privacy notice',
		lead: (c: LegalContext) =>
			`${c.name} runs this web app for its own members: music, concerts and programmes in one place. This page says which personal data it processes.`,
		sections: (c: LegalContext): LegalSection[] => [
			{
				heading: 'Signing in with Google',
				paragraphs: [
					'To sign in, the app sends you to Google. After signing in, the app receives your name and verified email address from Google. It receives no password and no access to the contents of your Google account.',
					'The app uses them to check whether you are a member of the orchestra and what you may do in the app. The legal basis is Art. 6(1)(b) GDPR (membership) and Art. 6(1)(f) GDPR (legitimate interest in protected access).'
				]
			},
			{
				heading: 'Member list',
				paragraphs: [
					`For managing access there is a member list in a Google sheet of the orchestra. It is kept by the people who may approve members (e.g. the committee).`
				],
				list: [
					'Members: email address, name, instruments, orchestras, status (active, paused with a date, inactive), groups and roles (e.g. “Committee”) and the rights given. You can change your name, instruments, orchestras and status yourself on your profile.',
					'Access by link: for members without a Google account, an admin can create a personal sign-in link. The sheet only holds a version number for it; a new link makes the old one invalid.',
					'Access requests: email address, name and date of the request. They are deleted once the request is decided.',
					'Member data is deleted when you leave or ask for it.'
				]
			},
			{
				heading: 'Reports and wishes',
				paragraphs: [
					`When you report a problem with music or enter a wish, the app saves your text with your name, email address and the date in the orchestra's Google sheet. When you give a wish a “+1”, your email address is saved with the wish so that everyone counts only once.`,
					`All members see reports and wishes, but not who wrote them or gave “+1”. Only the people who deal with reports or manage members see that, so they can ask back. Reports about a file can also appear as a comment on the file in Google Drive, without your name. The legal basis is Art. 6(1)(f) GDPR (legitimate interest in improving the music and the app together). Your entries are deleted on request.`
				]
			},
			{
				heading: 'Saying yes or no',
				paragraphs: [
					"When you say yes or no to a rehearsal or concert, the app saves your answer with name, email address, date, the instrument for that date and your comment in the orchestra's Google sheet. All members only see how many said yes per part; who answered what, and the comments, are seen only by people with the right to (e.g. conductor and organisers). The legal basis is Art. 6(1)(b) GDPR (the club's rehearsals). You can withdraw your answer at any time."
				]
			},
			{
				heading: 'Calendar link',
				paragraphs: [
					'On your profile you can create a personal calendar link for your calendar app to subscribe to. It contains the dates of your orchestras, your own answer and what is rehearsed. The sheet only holds a version number for it. Whoever has the link sees these details; “Create new link” or “Block link” makes the old one invalid at once.'
				]
			},
			{
				heading: 'Notifications',
				paragraphs: [
					"On your profile you can allow notifications for a device. The app then reminds you of rehearsals and concerts in the next few days that you haven't answered yet; people who look after rented music of return dates, and people who run the app of problems with the connection to Google. Nothing is sent at night.",
					"For this the app stores the address your browser assigns for notifications, two keys for encryption and your email address, plus which reminder went to whom, so nobody gets one twice. This is kept in a database at Cloudflare (D1), not in the Google Sheet. The messages are delivered encrypted through your browser's service (Google for Chrome and Android, Apple for Safari and iPhone, Mozilla for Firefox), which can't read them.",
					'The legal basis is your consent (Art. 6(1)(a) GDPR). “Turn off” or signing out deletes the device at once; records of sent reminders are deleted after a year.'
				]
			},
			{
				heading: 'Email',
				paragraphs: [
					"If the orchestra has connected an email account, you can ask for a sign-in link on the sign-in page; it works for 15 minutes and is only sent to addresses on the member list. Anyone who hasn't allowed notifications on any device gets the same reminders by email, with links to answer straight away.",
					"The emails are sent through Gmail from the orchestra's Google account (Google Ireland Ltd.); Google processes your email address and the message for this. The app stores nothing more for it: links are signed and kept nowhere. So that the sign-in page can't be misused, the app counts for an hour how often a link was asked for per address and per IP address (in the database at Cloudflare).",
					"The legal basis is Art. 6(1)(b) GDPR (the club's rehearsals). You can turn email reminders off on your profile at any time; the app keeps that until you turn them on again."
				]
			},
			{
				heading: 'Attendance at rehearsals',
				paragraphs: [
					"After a rehearsal, people with the right “Take attendance” (e.g. conductor and organisers) can enter who was there. Only the date, name, email address and whether you were present are saved, in the “Attendance” tab of the orchestra's Google sheet. From this the app shows how many rehearsals before a concert you attended.",
					'Only you and the people with this right see it, not the other members. The legal basis is Art. 6(1)(b) GDPR (the club’s rehearsals). The entries are deleted when you leave or ask for it.'
				]
			},
			{
				heading: 'Notes on pieces and rehearsals',
				paragraphs: [
					"People who plan programmes can add notes from rehearsals to pieces (e.g. cuts or bowings) and, after a rehearsal, a note on what was rehearsed. The text, the name of the person who wrote it and the date are saved in the “Piece notes” and “Rehearsal notes” tabs of the orchestra's Google sheet. Every member sees them. The legal basis is Art. 6(1)(b) GDPR (the club’s rehearsals)."
				]
			},
			{
				heading: 'Looking up details of pieces',
				paragraphs: [
					'Whoever keeps details of pieces can search for the work on Wikidata (Wikimedia Foundation, USA) at the press of a button. Your browser then sends the title of the piece and the composer entered to Wikidata; as with every page visit, Wikimedia learns your IP address. No data about you or other members is sent. The Wikimedia Foundation’s privacy policy applies (foundation.wikimedia.org/wiki/Policy:Privacy_policy).',
					'“Read from the music” reads the text of a PDF’s first pages in your browser only and takes nothing but composer, arranger and catalogue number from it. “Search for a recording on YouTube” opens the YouTube search in a new window; Google’s privacy policy applies there. “Duration from the video” asks YouTube for the length of the linked video from the app’s server; only the video ID is sent.',
					"On a piece's page the app shows a portrait of the composer from Wikimedia Commons when there is one. The app's server fetches the image from Wikidata and Wikimedia Commons; your device doesn't contact Wikimedia, and only the composer's name is sent."
				]
			},
			{
				heading: 'Cookies and storage in the browser',
				paragraphs: [
					'The app only uses cookies that are strictly necessary, no analytics, tracking or advertising cookies. They need no consent.'
				],
				list: [
					'“session”: keeps you signed in. Contains your name and email address, is protected against changes and expires after 30 days, or at once when you sign out.',
					'“oauth_state”: protects sign-in against misuse and is deleted after 10 minutes at most.',
					'“instrument”: remembers on “My parts” which instrument you play when you aren’t signed in. Expires after a year.',
					'“konzerte-ansicht”: remembers whether you want to see the concerts as a list or a calendar. Expires after a year.',
					'Your browser’s storage (localStorage) remembers whether you chose the light or dark colour scheme, and which pieces and concerts you last opened from the quick search. This never leaves your browser.'
				]
			},
			{
				heading: 'Hosting at Cloudflare',
				paragraphs: [
					'The app runs at Cloudflare (Cloudflare, Inc., USA, with data centres worldwide). For every visit, your IP address, the time and the address visited are processed to deliver the page and protect it from attacks (Art. 6(1)(f) GDPR). Cloudflare is certified under the EU-US Data Privacy Framework.',
					'Date polls (if the orchestra uses them): polls and answers – your name, email address, answers and comment – are stored by the app in a database at Cloudflare (D1). Only the groups a poll is meant for see them, and they’re gone when the poll is deleted.'
				]
			},
			{
				heading: 'Music, dates and the sheet at Google',
				paragraphs: [
					`Music, rehearsal dates and the repertoire sheet are kept in the orchestra's Google Drive, Google Calendar and Google Sheets. The app reads them with a technical account of its own. When you open music, it opens directly at Google, signed in with your own Google account. Google’s privacy policy applies (policies.google.com/privacy). Google is certified under the EU-US Data Privacy Framework.`
				]
			},
			{
				heading: 'Your rights',
				paragraphs: [
					'You have the right of access, rectification, erasure, restriction of processing and data portability, and the right to object to processing (Art. 15 to 21 GDPR). Please write to the contact address above.',
					'What the app keeps about you in the Google sheet you can download yourself at any time, under “Download my data” in your profile.',
					'You can also complain to a data protection supervisory authority (Art. 77 GDPR).'
				]
			}
		]
	},

	terms: {
		title: 'Terms of use',
		lead: (c: LegalContext) => `${c.name} provides this web app to its own members free of charge.`,
		sections: (c: LegalContext): LegalSection[] => [
			{
				heading: 'Who may use the app',
				paragraphs: [
					`The app is only for members of the orchestra. Access is approved by the people responsible for it. Only sign in with your own Google account and don't pass your access on.`
				]
			},
			{
				heading: 'Music and copyright',
				paragraphs: [
					`Much of the music is protected by copyright or licensed for the orchestra only. Use it only for the orchestra's rehearsals and performances and for practising for them.`
				],
				list: [
					"Don't pass music on to people outside the orchestra.",
					"Don't publish or share it on the internet, including messengers and social networks."
				]
			},
			{
				heading: 'Content',
				paragraphs: [
					'Programmes, dates and details of pieces are kept by members and can contain mistakes. What the musical director and the committee agree on is binding.'
				]
			},
			{
				heading: 'Availability and changes',
				paragraphs: [
					'There is no claim that the app is available at all times. It can be changed or discontinued. Access ends when you leave the orchestra and can be withdrawn for breaches of these terms.'
				]
			}
		]
	}
};
