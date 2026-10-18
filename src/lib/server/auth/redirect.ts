/** Only paths on this site, so the sign-in can't be used to send people elsewhere. */
export function safeReturnPath(value: string | null | undefined): string {
	// "//host" and "/\host" are treated as other sites by browsers.
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
	return value;
}
