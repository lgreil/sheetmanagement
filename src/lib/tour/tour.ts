import { t } from '#lib/i18n/index.ts';

/**
 * The tour for new members: the main pages one after another, pointing at their entries in
 * the navigation, then the member's own profile, where they set their instruments, the
 * colour scheme and notifications with the profile's own controls. Offered once; finishing
 * or skipping it is remembered (D1 for those signed in, the browser otherwise).
 */

/** How the tour ended: taken to the end, or skipped. */
export type TourOutcome = 'done' | 'skipped';

export interface TourStep {
	key: keyof typeof t.tour.steps;
	/** The page the step is shown on; the tour goes there first. */
	path: string;
	/**
	 * What the step points at, as a CSS selector; the first visible match counts, so the
	 * header's link on wide screens and the tab bar's on phones. None: the card alone.
	 */
	target?: string;
	/** Left out when its target isn't on the page, e.g. notifications that aren't set up. */
	optional?: boolean;
}

/** The steps; those about the profile only for someone signed in, who has one. */
export function tourSteps({ account }: { account: boolean }): TourStep[] {
	return [
		{ key: 'home', path: '/', target: '[data-tour="/"]' },
		{ key: 'calendar', path: '/kalender', target: '[data-tour="/kalender"]' },
		{ key: 'parts', path: '/meine-noten', target: '[data-tour="instrument"]' },
		{ key: 'pieces', path: '/stuecke', target: '[data-tour="/stuecke"]' },
		{ key: 'more', path: '/stuecke', target: '[data-tour="more"]' },
		...(account
			? ([
					{ key: 'profile', path: '/profil', target: '[data-tour="profile"]', optional: true },
					{ key: 'theme', path: '/profil', target: '[data-tour="theme"]' },
					{ key: 'notifications', path: '/profil', target: '#benachrichtigungen, #email', optional: true },
					{ key: 'done', path: '/profil', target: '[data-tour="retake"]' }
				] satisfies TourStep[])
			: ([{ key: 'doneOpen', path: '/' }] satisfies TourStep[]))
	];
}

/** How the tour ended, from a form or the browser's storage; anything else is nothing. */
export function readOutcome(value: unknown): TourOutcome | null {
	return value === 'done' || value === 'skipped' ? value : null;
}

/** Where people without an account keep how the tour ended. */
export const TOUR_STORAGE_KEY = 'tour';

/**
 * Whether to offer the tour: the server's answer for someone signed in; for everyone else
 * (or when the database didn't answer) what this browser remembers.
 */
export function shouldOffer(server: 'offer' | 'seen' | 'local', stored: string | null): boolean {
	return server === 'offer' || (server === 'local' && !readOutcome(stored));
}

export interface Box {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * Where the card goes: below what it points at, else above it, else at the bottom of the
 * free space (a target taller than the screen); centred on the target but inside the screen.
 * Without a target it sits at the bottom, in the middle. `view` is the space between the
 * header and the tab bar, `width` the whole screen's.
 */
export function placeCard(target: Box | null, card: { width: number; height: number }, view: { width: number; top: number; bottom: number }, gap = 12) {
	const margin = 16;
	const clampLeft = (left: number) => Math.max(margin, Math.min(left, view.width - card.width - margin));
	if (!target) return { left: clampLeft((view.width - card.width) / 2), top: view.bottom - card.height - margin, side: 'none' as const };
	const left = clampLeft(target.left + target.width / 2 - card.width / 2);
	const below = target.top + target.height + gap;
	if (below + card.height <= view.bottom - margin) return { left, top: Math.max(below, view.top + margin), side: 'below' as const };
	const above = target.top - gap - card.height;
	if (above >= view.top + margin) return { left, top: Math.min(above, view.bottom - card.height - margin), side: 'above' as const };
	return { left, top: view.bottom - card.height - margin, side: 'over' as const };
}
