import type { Right } from '#lib/access/access.ts';
import type { IconName } from '#lib/components/Icon.svelte';
import { ALL_ON, type Features } from '#lib/features.ts';
import { t } from '#lib/i18n/index.ts';

/**
 * The app's pages grouped by who uses them: what every member plays and joins in, then the
 * work some people do for everyone (looking after the sheet music, running the app). The
 * header and the tab bar show the few pages members use most; the "Mehr" menu lists every
 * group, so each page a person may open is reachable from the navigation.
 */

export interface NavItem {
	href: string;
	label: string;
	icon: IconName;
	/** Shown in the header and the mobile tab bar, not only in "Mehr". */
	primary?: boolean;
}

export interface NavGroup {
	key: 'musik' | 'mitmachen' | 'pflege' | 'verwaltung';
	label: string;
	items: NavItem[];
	/**
	 * A workspace: pages that belong to one job and are used one after another. Their pages
	 * show the group as tabs, and the start page shows the group as one entry.
	 */
	workspace?: boolean;
}

export interface NavContext {
	/** Sign-in mode: "off" leaves the app open and read-only. */
	auth: 'on' | 'off';
	rights: readonly Right[] | ReadonlySet<Right>;
	/** Parts of the app that are on (#134); all of them when left out. */
	features?: Features;
}

const has = (rights: NavContext['rights'], right: Right) =>
	Array.isArray(rights) ? rights.includes(right) : (rights as ReadonlySet<Right>).has(right);

export function navGroups({ auth, rights, features = ALL_ON }: NavContext): NavGroup[] {
	const admin = has(rights, 'mitglieder.verwalten');
	const groups: NavGroup[] = [
		{
			key: 'musik',
			label: t.nav.groups.musik,
			items: [
				{ href: '/meine-noten', label: t.nav.myParts, icon: 'parts', primary: true },
				{ href: '/konzerte', label: t.nav.concerts, icon: 'calendar', primary: true },
				{ href: '/stuecke', label: t.nav.pieces, icon: 'music', primary: true }
			]
		},
		{
			key: 'mitmachen',
			label: t.nav.groups.mitmachen,
			// Wishes need someone signed in, so each +1 counts once; the profile too.
			items:
				auth === 'on'
					? [
							...(features.wishes ? [{ href: '/wuensche', label: t.nav.wishes, icon: 'bulb' as const }] : []),
							// Also behind the avatar in the header; here it's reachable from the phone's tab bar.
							{ href: '/profil', label: t.nav.profile, icon: 'user' as const }
						]
					: []
		},
		{
			// The music librarian's desk: what's broken, missing or borrowed, and the archive's details.
			key: 'pflege',
			label: t.nav.groups.pflege,
			workspace: true,
			items: has(rights, 'stuecke.bearbeiten')
				? [
						{ href: '/meldungen', label: t.nav.reports, icon: 'flag' },
						{ href: '/fehlende-stimmen', label: t.nav.gaps, icon: 'alert' },
						{ href: '/stuecke/angaben', label: t.nav.details, icon: 'sparkle' },
						{ href: '/namen', label: t.nav.naming, icon: 'text' },
						...(features.loans ? [{ href: '/leihmaterial', label: t.nav.loans, icon: 'loan' as const }] : [])
					]
				: []
		},
		{
			key: 'verwaltung',
			label: t.nav.groups.verwaltung,
			workspace: true,
			items: [
				...(admin && auth === 'on' ? [{ href: '/admin', label: t.nav.admin, icon: 'shield' as const }] : []),
				// Setup and status are open while sign-in is off; that's how a deployment is set up.
				...(admin || auth === 'off'
					? [
							{ href: '/setup', label: t.nav.setup, icon: 'sliders' as const },
							{ href: '/status', label: t.nav.status, icon: 'activity' as const }
						]
					: [])
			]
		}
	];
	return groups.filter((group) => group.items.length);
}

/**
 * The navigation entry for the current page: the most specific one, so "/stuecke/angaben"
 * counts as "Angaben ergänzen", not as the archive. Home only on the start page.
 */
export function currentItem(groups: NavGroup[], path: string): { group: NavGroup; item: NavItem } | undefined {
	return groups
		.flatMap((group) => group.items.filter((item) => isActive(item.href, path)).map((item) => ({ group, item })))
		.sort((a, b) => b.item.href.length - a.item.href.length)[0];
}

/** The workspace the current page belongs to, for its tabs; only with more than one page. */
export function workspaceOf(groups: NavGroup[], path: string): NavGroup | undefined {
	const group = currentItem(groups, path)?.group;
	return group?.workspace && group.items.length > 1 ? group : undefined;
}

/** The pages shown directly in the header and the tab bar: the home page plus the primary ones. */
export function primaryNav(groups: NavGroup[]): NavItem[] {
	return [{ href: '/', label: t.nav.home, icon: 'home' }, ...groups.flatMap((group) => group.items.filter((item) => item.primary))];
}

/** Whether `href` is the current page or a page below it ("/stuecke" for "/stuecke/abc"). */
export function isActive(href: string, path: string): boolean {
	return href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
}
