import { error } from '@sveltejs/kit';
import { config } from '#lib/config/index.ts';
import { coverage, parseInstrument, playedParts, programInstruments } from '#lib/music/my-parts.ts';
import { getLibrary, type Library, type ProgramItem } from '#lib/server/library.ts';
import { getAccessList } from '#lib/server/repertoire.ts';
import type { ShownEvent } from '#lib/events/schedule.ts';
import type { PageServerLoad } from './$types';

/** Calendar descriptions may contain simple HTML; the page shows plain text. */
function plainText(html: string | undefined): string | undefined {
	if (!html) return undefined;
	let text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n');
	// Repeated, so nested leftovers like "<scr<b>ipt>" don't survive as a tag.
	for (let previous = ''; previous !== text; ) {
		previous = text;
		text = text.replace(/<[^<>]*>/g, '');
	}
	text = text
		// One pass, so "&amp;lt;" stays "&lt;" instead of becoming "<".
		.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (_, name: keyof typeof ENTITIES) => ENTITIES[name])
		.replace(/\n{3,}/g, '\n\n')
		.trim();
	return text || undefined;
}

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };

/**
 * Pieces × instruments for the programme, so missing parts are found before the first
 * rehearsal. Columns: every instrument with a part in the programme, plus the ones
 * members play (from "Mitglieder"), which the page can filter down to.
 */
async function instrumentation(items: ProgramItem[], library: Library) {
	const rows = items.map((item) => {
		const piece = item.pieceId ? library.piecesById.get(item.pieceId) : undefined;
		return { item, parts: piece?.detail ? playedParts(piece.detail) : [] };
	});
	const withMusic = rows.filter((row) => row.parts.length);
	if (!withMusic.length) return null;

	const access = await getAccessList();
	const played = new Set(
		(access?.members ?? []).flatMap((member) => parseInstrument(member.instrument ?? '', config)?.instrument ?? [])
	);
	const needed = new Set(programInstruments(withMusic.map((row) => row.parts), config));
	const instruments = config.instruments
		.map((instrument) => instrument.name)
		.filter((name) => needed.has(name) || (played.has(name) && name !== 'Partitur'));
	return {
		instruments: instruments.map((name) => ({ name, played: played.has(name) })),
		rows: rows.map(({ item, parts }) => ({
			title: item.title,
			pieceId: item.pieceId,
			hasMusic: parts.length > 0,
			cells: instruments.map((name) => (parts.length ? coverage(parts, name, config) : ('none' as const)))
		}))
	};
}

const mapUrl = (location: string | undefined) =>
	location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : undefined;

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const library = await getLibrary();
	const schedule = library.schedule;
	const event = schedule.ok ? schedule.byId.get(params.id) : undefined;
	// Concerts from the sheet: from the orchestra's history, or no longer in the calendar.
	const concert = library.concertsById.get(params.id);

	if (!event && !concert) {
		if (!schedule.ok) error(503, 'Der Kalender ist gerade nicht erreichbar.');
		error(404, 'Diesen Termin gibt es nicht (mehr) im Kalender.');
	}

	const items = concert?.program ?? [];
	const program = {
		items,
		canEdit: locals.access.rights.has('programme.bearbeiten') && !!concert?.sheet,
		// For whoever plans programmes; it reads every piece's parts.
		instrumentation: locals.access.rights.has('programme.bearbeiten') && items.length ? await instrumentation(items, library) : null,
		saved: url.searchParams.has('gespeichert'),
		sheet: library.sheet
	};

	if (!event) {
		const { title, label, dateText, location, orchestra } = concert!;
		return { kind: 'archive' as const, archive: { title, label, dateText, location, orchestra }, mapUrl: mapUrl(location), program };
	}

	const lookup = (id: string) => (schedule.ok ? schedule.byId.get(id) : undefined);
	return {
		kind: 'event' as const,
		event: { ...event, description: plainText(event.description) },
		rehearsals: event.rehearsalIds.map(lookup).filter((e): e is ShownEvent => !!e),
		concert: event.concertId ? lookup(event.concertId) : undefined,
		mapUrl: mapUrl(event.location),
		program
	};
};
