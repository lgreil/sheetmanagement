import type { Right } from '#lib/access/access.ts';
import type { IconName } from '#lib/components/Icon.svelte';
import { t } from '#lib/i18n/index.ts';

/**
 * The app's pages grouped by what people do with them. The header and the tab bar show
 * the few pages members use most; the "Mehr" menu lists every group, so each page a
 * person may open is reachable from the navigation.
 */

export interface NavItem {
	href: string;
	label: string;
	icon: IconName;
	/** Shown in the header and the mobile tab bar, not only in "Mehr". */
	primary?: boolean;
}

export interface NavGroup {
	key: 'proben' | 'archiv' | 'mitmachen' | 'verwaltung';
	label: string;
	items: NavItem[];
}

export interface NavContext {
	/** Sign-in mode: "off" leaves the app open and read-only. */
	auth: 'on' | 'off';
	rights: readonly Right[] | ReadonlySet<Right>;
}

const has = (rights: NavContext['rights'], right: Right) =>
	Array.isArray(rights) ? rights.includes(right) : (rights as ReadonlySet<Right>).has(right);

export function navGroups({ auth, rights }: NavContext): NavGroup[] {
	const admin = has(rights, 'mitglieder.verwalten');
	const groups: NavGroup[] = [
		{
			key: 'proben',
			label: t.nav.groups.proben,
			items: [
				{ href: '/meine-noten', label: t.nav.myParts, icon: 'user', primary: true },
				{ href: '/konzerte', label: t.nav.concerts, icon: 'calendar', primary: true }
			]
		},
		{
			key: 'archiv',
			label: t.nav.groups.archiv,
			items: [
				{ href: '/stuecke', label: t.nav.pieces, icon: 'music', primary: true },
				{ href: '/fehlende-stimmen', label: t.nav.gaps, icon: 'alert' }
			]
		},
		{
			key: 'mitmachen',
			label: t.nav.groups.mitmachen,
			items: [
				// Wishes need someone signed in, so each +1 counts once.
				...(auth === 'on' ? [{ href: '/wuensche', label: t.nav.wishes, icon: 'bulb' as const }] : []),
				...(has(rights, 'stuecke.bearbeiten') ? [{ href: '/meldungen', label: t.nav.reports, icon: 'flag' as const }] : [])
			]
		},
		{
			key: 'verwaltung',
			label: t.nav.groups.verwaltung,
			items: [
				...(admin && auth === 'on' ? [{ href: '/admin', label: t.nav.admin, icon: 'shield' as const }] : []),
				// Setup and status are open while sign-in is off; that's how a deployment is set up.
				...(admin || auth === 'off'
					? [
							{ href: '/setup', label: t.nav.setup, icon: 'file' as const },
							{ href: '/status', label: t.nav.status, icon: 'refresh' as const }
						]
					: [])
			]
		}
	];
	return groups.filter((group) => group.items.length);
}

/** The pages shown directly in the header and the tab bar: the home page plus the primary ones. */
export function primaryNav(groups: NavGroup[]): NavItem[] {
	return [{ href: '/', label: t.nav.home, icon: 'home' }, ...groups.flatMap((group) => group.items.filter((item) => item.primary))];
}

/** Whether `href` is the current page or a page below it ("/stuecke" for "/stuecke/abc"). */
export function isActive(href: string, path: string): boolean {
	return href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
}
