/**
 * Where a request to the workers.dev address belongs once the app has its own domain (APP_URL),
 * or null to answer it here. Other hosts (localhost, the Cron Trigger's own call) stay.
 */
export function canonicalUrl(url: URL, appUrl: string | undefined): string | null {
	const own = appUrl?.trim();
	if (!own || !url.hostname.endsWith('.workers.dev')) return null;
	try {
		const target = new URL(url.pathname + url.search, own);
		return target.host === url.host ? null : target.href;
	} catch {
		return null;
	}
}
