/**
 * Links people type into the sheet or a form end up in an href, so only web links pass:
 * a cell edited by hand must not become a javascript: link.
 */
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
