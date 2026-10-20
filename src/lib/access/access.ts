import { LAYOUT, normalize, readTable, type Problem, type Table, type ColumnKey } from '#lib/repertoire/sheet.ts';

/** Deliberately few. Every member can view; the rest are granted in the "Rechte" tab. */
export const RIGHTS = [
	'ansehen',
	'programme.bearbeiten',
	'stuecke.bearbeiten',
	'archiv.bearbeiten',
	'mitglieder.verwalten'
] as const;
export type Right = (typeof RIGHTS)[number];

export const ACCESS_TABS = ['members', 'groups', 'rights', 'requests'] as const;
export type AccessTab = (typeof ACCESS_TABS)[number];
export type AccessValues = Partial<Record<AccessTab, string[][]>>;

/** Paused or inactive members keep their access, but don't count for coverage. */
export const MEMBER_STATUSES = ['aktiv', 'pausiert', 'inaktiv'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export interface Member {
	row: number;
	email: string;
	name: string;
	/** As entered, e.g. "Geige I & II, Viola"; read with parseInstruments. */
	instrument?: string;
	groups: string[];
	/** Short orchestra names ("EO", "A"). Empty: not set, so the member counts for every orchestra. */
	orchestras: string[];
	status: MemberStatus;
	/** "2027-03-31": paused up to and including this day. */
	pausedUntil?: string;
}

export interface Group {
	row: number;
	name: string;
	description?: string;
}

export interface Grant {
	row: number;
	/** An email address or a group name, as entered. */
	who: string;
	right: Right;
}

export interface AccessRequest {
	row: number;
	email: string;
	name: string;
	requestedAt: string;
}

export interface AccessList {
	/** Whether the "Mitglieder" tab exists; without it only bootstrap admins get in. */
	present: boolean;
	members: Member[];
	membersByEmail: Map<string, Member>;
	groups: Group[];
	grants: Grant[];
	requests: AccessRequest[];
	tables: { [K in AccessTab]?: Table<ColumnKey<K> & string> };
	problems: Problem[];
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** "Geigen, Vorstand" → ["Geigen", "Vorstand"] */
export const splitGroups = (text: string) =>
	text
		.split(/[,;]/)
		.map((group) => group.trim())
		.filter(Boolean);

export function buildAccessList(values: AccessValues): AccessList {
	const problems: Problem[] = [];
	const read = <K extends AccessTab>(key: K) =>
		values[key] ? readTable(values[key], LAYOUT[key].columns as Record<ColumnKey<K> & string, string>) : undefined;
	const tables = { members: read('members'), groups: read('groups'), rights: read('rights'), requests: read('requests') };

	const members: Member[] = [];
	const membersByEmail = new Map<string, Member>();
	for (const { row, values: v } of tables.members?.rows ?? []) {
		const email = normalizeEmail(v.email);
		if (!email) continue;
		if (membersByEmail.has(email)) {
			problems.push({ kind: 'duplicate-member', tab: LAYOUT.members.tab, row, value: v.email });
			continue;
		}
		const member: Member = {
			row,
			email,
			name: v.name || email,
			instrument: v.instrument || undefined,
			groups: splitGroups(v.groups),
			orchestras: splitGroups(v.orchestras),
			status: parseStatus(v.status),
			pausedUntil: parseDay(v.pausedUntil)
		};
		members.push(member);
		membersByEmail.set(email, member);
	}

	const groups = (tables.groups?.rows ?? [])
		.filter(({ values: v }) => v.name)
		.map(({ row, values: v }) => ({ row, name: v.name, description: v.description || undefined }));

	const grants: Grant[] = [];
	for (const { row, values: v } of tables.rights?.rows ?? []) {
		if (!v.who && !v.right) continue;
		const right = RIGHTS.find((r) => r === v.right.trim().toLowerCase());
		if (!right) {
			problems.push({ kind: 'unknown-right', tab: LAYOUT.rights.tab, row, value: v.right });
			continue;
		}
		if (v.who) grants.push({ row, who: v.who, right });
	}

	const requests = (tables.requests?.rows ?? [])
		.filter(({ values: v }) => v.email)
		.map(({ row, values: v }) => ({ row, email: normalizeEmail(v.email), name: v.name, requestedAt: v.requestedAt }));

	return { present: !!tables.members, members, membersByEmail, groups, grants, requests, tables, problems };
}

export interface User {
	email: string;
	name: string;
}

export interface Access {
	user: User | null;
	/** Listed in "Mitglieder", or a bootstrap admin. */
	member: boolean;
	/** From BOOTSTRAP_ADMINS: every right, whatever the sheet says. */
	bootstrapAdmin: boolean;
	rights: Set<Right>;
}

/** What a signed-in person may do: bootstrap admins everything, members "ansehen" plus their grants. */
export function resolveAccess(user: User | null, list: AccessList | null, bootstrapAdmins: string[]): Access {
	if (!user) return { user, member: false, bootstrapAdmin: false, rights: new Set() };
	const email = normalizeEmail(user.email);
	if (bootstrapAdmins.map(normalizeEmail).includes(email)) {
		return { user, member: true, bootstrapAdmin: true, rights: new Set(RIGHTS) };
	}
	const member = list?.membersByEmail.get(email);
	if (!member) return { user, member: false, bootstrapAdmin: false, rights: new Set() };

	const whos = new Set([email, ...member.groups.map(normalize)]);
	const rights = new Set<Right>(['ansehen']);
	for (const grant of list!.grants) {
		const who = grant.who.includes('@') ? normalizeEmail(grant.who) : normalize(grant.who);
		if (whos.has(who)) rights.add(grant.right);
	}
	return { user, member: true, bootstrapAdmin: false, rights };
}

/** "a@x.org, b@y.org" → ["a@x.org", "b@y.org"] */
export function parseEmailList(text: string | undefined): string[] {
	return (text ?? '')
		.split(/[,;\s]+/)
		.map(normalizeEmail)
		.filter((email) => email.includes('@'));
}

/**
 * Approving access requests: who becomes a member (each email once, skipping existing
 * members) and which request rows go. Only the emails the admin saw are touched, so a
 * request that arrives meanwhile stays open.
 */
export function planApproval(
	memberEmails: string[],
	requests: { row: number; email: string; name: string }[],
	emails: string[]
): { add: { email: string; name: string }[]; remove: number[] } {
	const wanted = new Set(emails.map(normalizeEmail));
	const known = new Set(memberEmails.map(normalizeEmail));
	const add: { email: string; name: string }[] = [];
	const remove: number[] = [];
	for (const request of requests) {
		const email = normalizeEmail(request.email);
		if (!wanted.has(email)) continue;
		remove.push(request.row);
		if (known.has(email)) continue;
		known.add(email);
		add.push({ email, name: request.name });
	}
	return { add, remove };
}

/** "anna.mueller@gmail.com" → "an…@gmail.com": enough to tell people apart, without showing the address. */
export function maskEmail(email: string): string {
	const at = email.indexOf('@');
	if (at < 0) return email;
	const local = email.slice(0, at);
	return `${local.slice(0, local.length > 3 ? 2 : 1)}…${email.slice(at)}`;
}

/** A name without a second word ("Anna") can't be told apart from another Anna. */
export const lacksSurname = (name: string) => !/\S\s+\S/.test(name.trim()) && !name.includes('@');

/** Empty or unknown counts as active, so a member is never left out by a typo. */
export function parseStatus(text: string): MemberStatus {
	const value = normalize(text);
	return MEMBER_STATUSES.find((status) => value.startsWith(status.slice(0, 4))) ?? 'aktiv';
}

/** "2027-03-31" or "31.3.2027" → "2027-03-31"; anything else is no date. */
export function parseDay(text: string): string | undefined {
	const value = text.trim();
	const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	const german = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
	const [year, month, day] = iso ? [iso[1], iso[2], iso[3]].map(Number) : german ? [german[3], german[2], german[1]].map(Number) : [];
	if (!year) return undefined;
	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined;
	return date.toISOString().slice(0, 10);
}

/** A pause with an end date is over the day after it; that needs no write to the sheet. */
export function currentStatus(member: Pick<Member, 'status' | 'pausedUntil'>, today: string): MemberStatus {
	return member.status === 'pausiert' && member.pausedUntil && member.pausedUntil < today ? 'aktiv' : member.status;
}

/** Whether a member plays in the orchestra; members without orchestras count for all of them. */
export function playsIn(member: Pick<Member, 'orchestras'>, orchestra: string | undefined): boolean {
	return !orchestra || !member.orchestras.length || member.orchestras.some((name) => normalize(name) === normalize(orchestra));
}

/** Members who count for a concert's instrumentation: active ones in its orchestra. */
export function countingMembers<M extends Pick<Member, 'orchestras' | 'status' | 'pausedUntil'>>(
	members: M[],
	orchestra: string | undefined,
	today: string
): M[] {
	return members.filter((member) => currentStatus(member, today) === 'aktiv' && playsIn(member, orchestra));
}
