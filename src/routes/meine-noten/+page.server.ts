import { fail } from '@sveltejs/kit';
import { normalizeEmail } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { formatInstrument, matchParts, parseInstrument, playedParts, type InstrumentChoice } from '#lib/music/my-parts.ts';
import type { Part } from '#lib/music/types.ts';
import { fileUrl } from '#lib/server/catalog.ts';
import { getLibrary, isPastConcert, type LibraryConcert } from '#lib/server/library.ts';
import { getAccessList } from '#lib/server/repertoire.ts';
import { readTab, refreshAfterWrite, updateRecord } from '#lib/server/sheet-writes.ts';
import type { Actions, PageServerLoad } from './$types';

/** Remembers the instrument in the browser too: for people not in "Mitglieder" and while sign-in is off. */
const COOKIE = 'instrument';
const YEAR = 365 * 24 * 60 * 60;

/** Instruments to pick from: real instruments, not shared parts or numbered voices. */
const CHOICES = config.instruments
	.filter((instrument) => !instrument.voice && instrument.family !== 'sonstige' && instrument.name !== 'Holz' && instrument.name !== 'Blech')
	.map((instrument) => instrument.name);

const PDF = 'application/pdf';
const shown = (part: Part) => ({ id: part.id, label: part.label, notes: part.notes, status: part.status, url: fileUrl(part.id, part.mimeType), pdf: part.mimeType === PDF });

/**
 * The concerts to show, one below the other: every upcoming one, soonest first, and a past
 * one asked for in the URL on top. `focus` is where the page starts: the one asked for,
 * else the next one with a programme.
 */
function pickConcerts(concerts: LibraryConcert[], today: string, wanted: string | null) {
	const upcoming = concerts.filter((concert) => !isPastConcert(concert, today)).reverse();
	const asked = wanted ? concerts.find((c) => c.id === wanted) : undefined;
	const shown = asked && !upcoming.includes(asked) ? [asked, ...upcoming] : upcoming;
	const focus = asked ?? upcoming.find((c) => c.program.length) ?? upcoming[0];
	return { shown, focus };
}

export const load: PageServerLoad = async ({ url, cookies, locals }) => {
	const [library, access] = await Promise.all([getLibrary(), getAccessList()]);
	const member = locals.access.user ? access?.membersByEmail.get(normalizeEmail(locals.access.user.email)) : undefined;

	// What to show: asked for in the URL, else remembered in this browser, else from "Mitglieder".
	const text = url.searchParams.get('instrument') ?? cookies.get(COOKIE) ?? member?.instrument ?? '';
	const choice = parseInstrument(text, config);

	const { shown: concerts, focus } = pickConcerts(library.concerts, library.today, url.searchParams.get('konzert'));
	const piecesOf = (concert: LibraryConcert) =>
		concert.program.map((item) => {
			const piece = item.pieceId ? library.piecesById.get(item.pieceId) : undefined;
			const parts = piece?.detail ? playedParts(piece.detail) : [];
			const match = choice && parts.length ? matchParts(parts, choice, config) : { own: [], shared: [] };
			return {
				position: item.position,
				title: item.title,
				subtitle: item.subtitle,
				pieceId: item.pieceId,
				hasMusic: parts.length > 0,
				recording: piece?.sheet?.recording,
				own: match.own.map(shown),
				shared: match.shared.map(shown)
			};
		});

	return {
		choice: choice ? { ...choice, label: formatInstrument(choice) } : null,
		unknown: !choice && text ? text : null,
		choices: CHOICES,
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
		const data = await request.formData();
		const instrument = String(data.get('instrument') ?? '');
		const number = Number(data.get('number')) || undefined;
		if (!CHOICES.includes(instrument)) return fail(400, { message: t.myParts.pickInstrument });
		const choice: InstrumentChoice = { instrument, ...(number && number <= 8 ? { number } : {}) };
		const text = formatInstrument(choice);
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
