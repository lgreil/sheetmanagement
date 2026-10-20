import type { LinkIcon, OrchestraLink } from '#lib/config/types.ts';

/**
 * Links people type into the sheet or a form end up in an href, so only web links pass:
 * a cell edited by hand must not become a javascript: link.
 */

/** The orchestra's links that are set and safe to show, with an icon each. */
export function orchestraLinks(links: OrchestraLink[] = []): { label: string; url: string; icon: LinkIcon }[] {
	return links.flatMap((link) => {
		const url = safeLink(link.url ?? '');
		const label = link.label?.trim();
		return url && label ? [{ label, url, icon: link.icon ?? 'globe' }] : [];
	});
}

/** "https://…" stays, anything else (javascript:, mailto:, plain text) is undefined. */
export function safeLink(text: string): string | undefined {
	const value = text.trim();
	if (!value) return undefined;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
	} catch {
		return undefined;
	}
}
