import { error, fail } from '@sveltejs/kit';
import { countingMembers, normalizeEmail } from '#lib/access/access.ts';
import { config } from '#lib/config/index.ts';
import { coverage, formatInstrument, parseInstruments, playableInstruments, playedParts, programInstruments } from '#lib/music/my-parts.ts';
import { t } from '#lib/i18n/index.ts';
import { ANSWERS, coverage as signupCoverage, totals, type Answer } from '#lib/signups/signups.ts';
import { feedbackUser, formText } from '#lib/server/feedback.ts';
import { today } from '#lib/server/members.ts';
import { saveSignup, withdrawSignup } from '#lib/server/signups.ts';
import { SheetLayoutError } from '#lib/server/sheet-writes.ts';
import { getLibrary, isPastConcert, namedItem, reportPieces, type Library, type LibraryConcert, type ProgramItem } from '#lib/server/library.ts';
import { getAccessList, getAttendance, getFeedback, getLoans, getMusicConfig, getRehearsalPlan, getSignups } from '#lib/server/repertoire.ts';
import { concertCheck } from '#lib/repertoire/concert-check.ts';
import { reportGaps } from '#lib/repertoire/music-report.ts';
import { loansOf } from '#lib/loans/loans.ts';
import { attendanceSummary } from '#lib/attendance/attendance.ts';
import type { RehearsalPlan } from '#lib/rehearsals/plan.ts';
import { normalize } from '#lib/repertoire/sheet.ts';
import type { ShownEvent } from '#lib/events/schedule.ts';
import type { Actions, PageServerLoad } from './$types';

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
 * members play (from "Mitglieder"), which the page can filter down to. Only active members
 * of the concert's orchestra count.
 */
async function instrumentation(items: ProgramItem[], library: Library, orchestra: string | undefined) {
	const rows = items.map((item) => {
		const piece = item.pieceId ? library.piecesById.get(item.pieceId) : undefined;
		return { item, parts: piece?.detail ? playedParts(piece.detail) : [] };
	});
	const withMusic = rows.filter((row) => row.parts.length);
	if (!withMusic.length) return null;

	const [access, music] = await Promise.all([getAccessList(), getMusicConfig()]);
	const played = new Set(
		countingMembers(access?.members ?? [], orchestra, library.today).flatMap((member) => parseInstruments(member.instrument ?? '', config).map((choice) => choice.instrument))
	);
	const needed = new Set(programInstruments(withMusic.map((row) => row.parts), music));
	const instruments = config.instruments
		.map((instrument) => instrument.name)
		.filter((name) => needed.has(name) || (played.has(name) && name !== 'Partitur'));
	return {
		instruments: instruments.map((name) => ({ name, played: played.has(name) })),
		rows: rows.map(({ item, parts }) => ({
			title: item.title,
			pieceId: item.pieceId,
			hasMusic: parts.length > 0,
			cells: instruments.map((name) => (parts.length ? coverage(parts, name, music) : ('none' as const)))
		}))
	};
}

/**
 * Sign-ups for an upcoming calendar event: the member's own answer, and the coverage per
 * section. Everyone sees the counts; names and comments need "anmeldungen.sehen".
 */
async function signups(event: ShownEvent, orchestra: string | undefined, locals: App.Locals) {
	if (event.past) return null;
	const user = feedbackUser(locals);
	if (!user) return locals.auth === 'on' ? { state: 'sign-in' as const } : null;
	const [list, access] = await Promise.all([getSignups(), getAccessList()]);
	if (!list) return { state: 'not-set-up' as const };
	const answers = list.byEvent.get(event.id) ?? [];
	const email = normalizeEmail(user.email);
	const mine = answers.find((signup) => signup.email === email);
	const member = access?.membersByEmail.get(email);
	const own = parseInstruments(member?.instrument ?? '', config);
	// The member's sections one by one ("Geige I", "Geige II", "Viola") to pick from.
	const ownSections = own.flatMap((choice) =>
		choice.numbers.length ? choice.numbers.map((n) => formatInstrument({ instrument: choice.instrument, numbers: [n] })) : [formatInstrument(choice)]
	);
	const sections = signupCoverage(answers, access?.members ?? [], config, { orchestra, today: today() });
	const seeAll = locals.access.rights.has('anmeldungen.sehen');
	return {
		state: 'ready' as const,
		mine: mine ? { answer: mine.answer, instrument: mine.instrument, comment: mine.comment } : null,
		ownInstrument: own[0] ? formatInstrument({ instrument: own[0].instrument, numbers: own[0].numbers.slice(0, 1) }) : '',
		ownSections,
		instruments: playableInstruments(config),
		totals: totals(sections),
		seeAll,
		sections: sections.map(({ label, yes, maybe, no, open }) => ({
			label,
			counts: { yes: yes.length, maybe: maybe.length, no: no.length, open: open.length },
			names: seeAll ? { yes, maybe, no, open } : null
		})),
		comments: seeAll
			? answers.filter((signup) => signup.comment).map((signup) => ({ name: access?.membersByEmail.get(signup.email)?.name ?? signup.name, comment: signup.comment }))
			: []
	};
}

/**
 * Attendance (#120). A rehearsal that has begun: how many came, for those who take it.
 * A concert: per member, how many of its rehearsals they came to, overall and per piece,
 * for those who take attendance; members see only their own count.
 */
async function attendance(event: ShownEvent, library: Library, plan: RehearsalPlan | null, locals: App.Locals) {
	const canTake = locals.access.rights.has('anwesenheit.erfassen');
	const user = feedbackUser(locals);
	const isRehearsal = event.type === 'probe' || event.type === 'generalprobe';
	if (isRehearsal) {
		if (!canTake || event.daysUntil > 0) return null;
		const taken = await getAttendance();
		if (!taken) return { kind: 'rehearsal' as const, state: 'not-set-up' as const };
		const entries = [...(taken.byEvent.get(event.id)?.values() ?? [])];
		return {
			kind: 'rehearsal' as const,
			state: 'ready' as const,
			present: entries.filter((entry) => entry.present).length,
			of: entries.length,
			url: `/konzerte/${encodeURIComponent(event.id)}/anwesenheit`
		};
	}
	if (event.type !== 'konzert' || !user) return null;
	const [taken, access] = await Promise.all([getAttendance(), canTake ? getAccessList() : null]);
	if (!taken) return null;
	const email = normalizeEmail(user.email);
	const planned = (id: string) => (plan?.byEvent.get(id) ?? []).map((entry) => normalize(entry.pieceName));
	const concert = library.concertsById.get(event.id);
	const orchestra = concert?.orchestra;
	// Ticked present at least once; unticked rows of the conductor or the board don't count.
	const recorded = new Set(
		event.rehearsalIds.flatMap((id) => [...(taken.byEvent.get(id)?.values() ?? [])].filter((entry) => entry.present).map((entry) => entry.email))
	);
	// Players: active members with an instrument; anyone else once they were ticked present.
	const people = canTake
		? [
				...new Set([
					...countingMembers(access?.members ?? [], orchestra, library.today)
						.filter((member) => member.instrument)
						.map((member) => member.email),
					...recorded
				])
			]
		: [email];
	const summary = attendanceSummary(taken, event.rehearsalIds, people, planned);
	if (!summary.taken) return null;
	// Own count for anyone with a row: a player who missed every rehearsal sees that too.
	const hasRow = event.rehearsalIds.some((id) => taken.byEvent.get(id)?.has(email));
	const mine = hasRow ? summary.members.find((member) => member.email === email) : undefined;
	if (!canTake) return { kind: 'concert' as const, taken: summary.taken, mine: mine && { present: mine.present, of: mine.of }, table: null };
	// Columns: the programme's pieces that were planned at a rehearsal with attendance taken.
	const program = concert?.sheet?.program ?? [];
	const columns = program
		.map((entry, i) => ({ key: normalize(entry.pieceName), title: concert?.program[i]?.title ?? entry.pieceName }))
		.filter((column) => summary.members.some((member) => member.pieces.get(column.key)?.of));
	const names = new Map([...(access?.members ?? [])].map((member) => [member.email, member.name]));
	for (const id of event.rehearsalIds) for (const entry of taken.byEvent.get(id)?.values() ?? []) if (!names.has(entry.email)) names.set(entry.email, entry.name);
	const rows = summary.members
		.map((member) => ({
			name: names.get(member.email) ?? member.email,
			present: member.present,
			of: member.of,
			pieces: columns.map((column) => member.pieces.get(column.key) ?? null)
		}))
		// Who missed most first: that's what the conductor looks for before the concert.
		.sort((a, b) => a.present / (a.of || 1) - b.present / (b.of || 1) || a.name.localeCompare(b.name, config.locale));
	return {
		kind: 'concert' as const,
		taken: summary.taken,
		mine: mine && { present: mine.present, of: mine.of },
		table: { columns: columns.map((column) => column.title), rows }
	};
}

/** After the concert, the check stays this long: for the music list and returning rented music. */
const CHECK_AFTER_DAYS = 60;

/** The planners' "Konzert-Check" (#117–#119 together); null when it doesn't apply. */
async function check(concert: LibraryConcert | undefined, event: ShownEvent | undefined, library: Library, plan: RehearsalPlan | null) {
	if (!concert?.sheet) return null;
	const past = isPastConcert(concert, library.today);
	if (past && (!event || event.daysUntil < -CHECK_AFTER_DAYS)) return null;
	const loans = (await getLoans())?.loans ?? [];
	const names = concert.sheet.program.map((entry) => entry.pieceName);
	const rehearsalIds = event?.rehearsalIds ?? [];
	const planned = new Set(rehearsalIds.flatMap((id) => (plan?.byEvent.get(id) ?? []).map((entry) => normalize(entry.pieceName))));
	const gaps = new Set(reportGaps(reportPieces(library, concert)).map((gap) => gap.title));
	const id = encodeURIComponent(concert.id);
	const items = concertCheck({
		past,
		program: concert.program.map((item) => ({ title: item.title, status: item.status, duration: item.duration, inReport: !gaps.has(item.title) })),
		rehearsals: rehearsalIds.length,
		unplanned: [...new Set(names.map(normalize))].filter((name) => !planned.has(name)).length,
		loans: [...new Set(names)].flatMap((name) =>
			loansOf(loans, name).map((loan) => ({
				title: namedItem(library, loan.pieceName).title,
				dueBeforeConcert: !!loan.dueAt && loan.dueAt < concert.dateKey
			}))
		),
		urls: {
			program: `/konzerte/${id}/programm`,
			plan: rehearsalIds.length ? `/konzerte/${id}/probenplan` : undefined,
			report: config.musicReport === false ? undefined : `/konzerte/${id}/drucken?art=musikfolge`,
			loans: '/leihmaterial',
			gaps: '/fehlende-stimmen'
		}
	});
	return items.length ? items : null;
}

async function openWishes(concertTitle: string) {
	const wishes = (await getFeedback())?.wishes ?? [];
	return wishes.filter(
		(wish) => wish.kind === 'piece' && wish.status === 'open' && (!wish.concert || normalize(wish.concert) === normalize(concertTitle))
	).length;
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
		instrumentation: locals.access.rights.has('programme.bearbeiten') && items.length ? await instrumentation(items, library, concert?.orchestra) : null,
		saved: url.searchParams.has('gespeichert'),
		sheet: library.sheet,
		sharedFrom: concert?.sharedFrom,
		sharedWith: concert?.sharedWith ?? [],
		// For planners: open piece wishes for this concert or any time, shown in the editor.
		suggestions: locals.access.rights.has('programme.bearbeiten') && concert?.sheet ? await openWishes(concert.sheet.title) : 0,
		check: locals.access.rights.has('programme.bearbeiten') ? await check(concert, event, library, await getRehearsalPlan()) : null
	};

	if (!event) {
		const { title, label, dateText, location, orchestra } = concert!;
		return { kind: 'archive' as const, archive: { title, label, dateText, location, orchestra }, mapUrl: mapUrl(location), program };
	}

	const lookup = (id: string) => (schedule.ok ? schedule.byId.get(id) : undefined);
	// A rehearsal belongs to the orchestra of the concert it prepares for.
	const orchestra = concert?.orchestra ?? (event.concertId ? library.concertsById.get(event.concertId)?.orchestra : undefined);
	// The rehearsal plan (#65): what's rehearsed when, edited per concert.
	const plan = await getRehearsalPlan();
	const planned = (id: string) => (plan?.byEvent.get(id) ?? []).map((entry) => namedItem(library, entry.pieceName, entry.notes));
	const planConcert = event.type === 'konzert' ? event : event.concertId ? lookup(event.concertId) : undefined;
	const canPlan = locals.access.rights.has('programme.bearbeiten') && !!planConcert?.rehearsalIds.length;
	return {
		kind: 'event' as const,
		signups: await signups(event, orchestra, locals),
		attendance: await attendance(event, library, plan, locals),
		attendanceSaved: url.searchParams.has('anwesenheit'),
		event: { ...event, description: plainText(event.description) },
		rehearsals: event.rehearsalIds
			.map(lookup)
			.filter((e): e is ShownEvent => !!e)
			.map((rehearsal) => ({ ...rehearsal, planned: planned(rehearsal.id).map(({ title, pieceId }) => ({ title, pieceId })) })),
		rehearsalPlan: {
			items: event.type === 'konzert' ? [] : planned(event.id),
			editUrl: canPlan ? `/konzerte/${encodeURIComponent(planConcert!.id)}/probenplan` : undefined,
			// The member's parts for this rehearsal (#115): planned pieces, else the whole programme.
			partsUrl:
				event.type !== 'konzert' && !event.past && (planned(event.id).length || library.concertsById.get(planConcert?.id ?? '')?.program.length)
					? `/meine-noten?probe=${encodeURIComponent(event.id)}`
					: undefined
		},
		concert: event.concertId ? lookup(event.concertId) : undefined,
		mapUrl: mapUrl(event.location),
		program
	};
};

/** The upcoming calendar event a sign-up is for, with a readable label for the sheet. */
async function upcoming(id: string) {
	const library = await getLibrary();
	const event = library.schedule.ok ? library.schedule.byId.get(id) : undefined;
	return event && !event.past ? { id: event.id, label: `${event.displayTitle} · ${event.date.long}` } : null;
}

/** Runs one sign-up write; a missing tab or a failed write becomes a message. */
async function signupChange(locals: App.Locals, id: string, work: (event: { id: string; label: string }, user: NonNullable<ReturnType<typeof feedbackUser>>) => Promise<void>) {
	const user = feedbackUser(locals);
	if (!user) return fail(403, { signupError: t.signups.signInNeeded });
	const event = await upcoming(id);
	if (!event) return fail(404, { signupError: t.signups.gone });
	try {
		await work(event, user);
		return { signupSaved: true };
	} catch (cause) {
		if (cause instanceof SheetLayoutError) return fail(409, { signupError: t.signups.notSetUp });
		console.error('Saving a sign-up failed:', cause);
		return fail(503, { signupError: t.signups.failed });
	}
}

export const actions: Actions = {
	/** One click: Zusage, Vielleicht or Absage; instrument and comment stay as they were. */
	answer: async ({ request, locals, params }) => {
		const data = await request.formData();
		const answer = formText(data, 'answer') as Answer;
		if (!ANSWERS.includes(answer)) return fail(400, { signupError: t.signups.failed });
		const details = data.has('comment')
			? {
					instrument: parseInstruments(formText(data, 'instrument'), config).length ? formText(data, 'instrument') : '',
					comment: formText(data, 'comment', 500)
				}
			: {};
		return signupChange(locals, params.id, (event, user) => saveSignup(event, user, { answer, ...details }));
	},

	withdraw: ({ locals, params }) => signupChange(locals, params.id, (event, user) => withdrawSignup(event.id, user))
};
