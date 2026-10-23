/**
 * Sending email through the Gmail API with plain fetch (#123): the orchestra's own Google
 * account sends, with a refresh token for the gmail.send scope only. Free, and mail from a
 * real Gmail or Workspace address stays out of spam without a domain of our own.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

export class MailError extends Error {
	constructor(
		message: string,
		/** Google took the permission back (revoked, password changed, app in testing for 7 days): connect again. */
		readonly revoked = false
	) {
		super(message);
		this.name = 'MailError';
	}
}

export interface MailMessage {
	from: { name: string; email: string };
	to: string;
	subject: string;
	/** Plain text; links on lines of their own, so every mail program makes them clickable. */
	text: string;
}

const encoder = new TextEncoder();

function base64(text: string): string {
	let binary = '';
	for (const byte of encoder.encode(text)) binary += String.fromCharCode(byte);
	return btoa(binary);
}

const base64url = (text: string) => base64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** A header value: plain ASCII as it is, anything else as an RFC 2047 encoded word. */
export function encodeHeader(value: string): string {
	const clean = value.replace(/[\r\n]+/g, ' ');
	return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?UTF-8?B?${base64(clean)}?=`;
}

/** "Name" <address>, with the name quoted or encoded. */
function mailbox(name: string, email: string): string {
	const safe = name.replace(/[\r\n"\\]+/g, ' ').trim();
	if (!safe) return `<${email}>`;
	return /^[\x20-\x7e]*$/.test(safe) ? `"${safe}" <${email}>` : `${encodeHeader(safe)} <${email}>`;
}

/** The message as Gmail wants it: RFC 5322 with CRLF, the body in base64. */
export function buildMessage(message: MailMessage): string {
	if (/[\r\n<>,]/.test(message.to) || /[\r\n<>,]/.test(message.from.email)) throw new MailError('Invalid address');
	const body = base64(message.text.replace(/\r?\n/g, '\r\n')).replace(/.{76}/g, '$&\r\n');
	return [
		`From: ${mailbox(message.from.name, message.from.email)}`,
		`To: ${message.to}`,
		`Subject: ${encodeHeader(message.subject)}`,
		'MIME-Version: 1.0',
		'Content-Type: text/plain; charset=UTF-8',
		'Content-Transfer-Encoding: base64',
		// Reminders shouldn't trigger out-of-office replies to the orchestra's account.
		'Auto-Submitted: auto-generated',
		'',
		body
	].join('\r\n');
}

export interface MailClient {
	clientId: string;
	clientSecret: string;
}

/** A fresh access token for the account behind the refresh token. */
export async function accessToken(
	client: MailClient,
	refreshToken: string,
	fetchImpl: typeof fetch = (input, init) => fetch(input, init)
): Promise<{ token: string; expiresAt: number }> {
	const response = await fetchImpl(TOKEN_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: client.clientId,
			client_secret: client.clientSecret,
			refresh_token: refreshToken,
			grant_type: 'refresh_token'
		}),
		signal: AbortSignal.timeout(10_000)
	});
	const body = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
	if (!response.ok || !body.access_token) {
		throw new MailError(`Google token (${response.status}): ${body.error_description ?? body.error ?? 'no token'}`, body.error === 'invalid_grant');
	}
	return { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
}

export async function sendGmail(token: string, message: MailMessage, fetchImpl: typeof fetch = (input, init) => fetch(input, init)): Promise<void> {
	const response = await fetchImpl(SEND_URL, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
		body: JSON.stringify({ raw: base64url(buildMessage(message)) }),
		signal: AbortSignal.timeout(15_000)
	});
	if (!response.ok) {
		const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
		throw new MailError(`Gmail (${response.status}): ${body.error?.message ?? 'not sent'}`, response.status === 401 || response.status === 403);
	}
}

/** The account's refresh token and address, from the code Google sends back after consent. */
export async function exchangeMailCode(
	client: MailClient & { redirectUri: string },
	code: string,
	fetchImpl: typeof fetch = (input, init) => fetch(input, init)
): Promise<{ refreshToken: string; idToken: string; scope: string }> {
	const response = await fetchImpl(TOKEN_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: client.clientId,
			client_secret: client.clientSecret,
			redirect_uri: client.redirectUri,
			grant_type: 'authorization_code'
		}),
		signal: AbortSignal.timeout(10_000)
	});
	const body = (await response.json().catch(() => ({}))) as { refresh_token?: string; id_token?: string; scope?: string; error?: string; error_description?: string };
	if (!response.ok || !body.id_token) throw new MailError(body.error_description ?? body.error ?? `Token request failed (${response.status})`);
	if (!body.refresh_token) throw new MailError('Google sent no refresh token');
	return { refreshToken: body.refresh_token, idToken: body.id_token, scope: body.scope ?? '' };
}
