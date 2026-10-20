import { fail } from '@sveltejs/kit';
import { currentStatus, normalizeEmail, playsIn, type Member } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { choicesFromForm, commonInstruments, formatInstrument, formatInstruments, matchParts, parseInstruments, playableInstruments, playedParts } from '#lib/music/my-parts.ts';
import type { Part } from '#lib/music/types.ts';
import { partUrl } from '#lib/server/catalog.ts';
import { getLibrary, isPastConcert, type LibraryConcert } from '#lib/server/library.ts';
import { getAccessList, getMusicConfig } from '#lib/server/repertoire.ts';
import { readTab, refreshAfterWrite, updateRecord } from '#lib/server/sheet-writes.ts';
import type { Actions, PageServerLoad } from './$types';

/** Remembers the instrument in the browser too: for people not in "Mitglieder" and while sign-in is off. */
const COOKIE = 'instrument';
const YEAR = 365 * 24 * 60 * 60;

/** Instruments to pick from: real instruments, not shared parts or numbered voices. */
const CHOICES = playableInstruments(config);

const PDF = 'application/pdf';
const shown = (part: Part, viaLink?: boolean) => ({
	id: part.id,
	label: part.label,
	notes: part.notes,
	status: part.status,
	url: partUrl(part.id, part.mimeType, viaLink),
	pdf: part.mimeType === PDF
});

/**
 * The concerts to show, one below the other: every upcoming one of the member's orchestras,
 * soonest first, and one asked for in the URL on top. `focus` is where the page starts: the
 * one asked for, else the next one with a programme.
 */
function pickConcerts(concerts: LibraryConcert[], today: string, wanted: string | null, member: Member | undefined) {
	const upcoming = concerts
		.filter((concert) => !isPastConcert(concert, today) && (!member || playsIn(member, concert.orchestra)))
		.reverse();
	const asked = wanted ? concerts.find((c) => c.id === wanted) : undefined;
	const shown = asked && !upcoming.includes(asked) ? [asked, ...upcoming] : upcoming;
	const focus = asked ?? upcoming.find((c) => c.program.length) ?? upcoming[0];
	return { shown, focus };
}

export const load: PageServerLoad = async ({ url, cookies, locals }) => {
	const [library, access, music] = await Promise.all([getLibrary(), getAccessList(), getMusicConfig()]);
	const member = locals.access.user ? access?.membersByEmail.get(normalizeEmail(locals.access.user.email)) : undefined;

	// What to show: asked for in the URL, else from "Mitglieder" (it follows members to every
	// device and the profile page edits it), else remembered in this browser.
	const text = url.searchParams.get('instrument') ?? member?.instrument ?? cookies.get(COOKIE) ?? '';
	const choices = parseInstruments(text, config);

	const { shown: concerts, focus } = pickConcerts(library.concerts, library.today, url.searchParams.get('konzert'), member);
	const piecesOf = (concert: LibraryConcert) =>
		concert.program.map((item) => {
			const piece = item.pieceId ? library.piecesById.get(item.pieceId) : undefined;
			const parts = piece?.detail ? playedParts(piece.detail) : [];
			return {
				position: item.position,
				title: item.title,
				subtitle: item.subtitle,
				pieceId: item.pieceId,
				hasMusic: parts.length > 0,
				recording: piece?.sheet?.recording,
				// One block per instrument the member plays.
				matches: choices.map((choice) => {
					const match = parts.length ? matchParts(parts, choice, music) : { own: [], shared: [] };
					const show = (part: Part) => shown(part, locals.access.viaLink);
					return { label: formatInstrument(choice), own: match.own.map(show), shared: match.shared.map(show) };
				})
			};
		});

	return {
		choices,
		label: formatInstruments(choices),
		unknown: !choices.length && text ? text : null,
		// Paused and inactive members still get their parts, with a hint.
		status: member ? currentStatus(member, library.today) : 'aktiv',
		pausedUntil: member?.pausedUntil,
		instruments: CHOICES,
		common: commonInstruments(config),
		concerts: concerts.map((concert) => ({
			id: concert.id,
			title: concert.title,
			label: concert.label?.long,
			pieces: piecesOf(concert)
		})),
		focus: focus?.id ?? null,
		// Merging fetches the PDFs through the app, which is for signed-in members only.
		canMerge: locals.auth === 'on' && locals.access.member
	};
};

export const actions: Actions = {
	save: async ({ request, cookies, locals, url }) => {
		const choices = choicesFromForm(await request.formData(), CHOICES);
		if (!choices.length) return fail(400, { message: t.myParts.pickInstrument });
		const text = formatInstruments(choices);
		cookies.set(COOKIE, text, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: YEAR, secure: url.protocol === 'https:' });

		// Members listed in "Mitglieder" get it saved there too, so it follows them to other devices.
		const user = locals.auth === 'on' && locals.access.member ? locals.access.user : null;
		if (user) {
			try {
				const members = await readTab('members');
				const row = members.rows.find((r) => normalizeEmail(r.values.email) === normalizeEmail(user.email));
				if (row && row.values.instrument !== text) {
					await updateRecord('members', members, row.row, { instrument: text });
					await refreshAfterWrite();
				}
			} catch (error) {
				// The cookie still works; the sheet can be fixed by hand.
				console.error('Saving the instrument in Mitglieder failed:', error);
			}
		}
		return { saved: true };
	}
};
