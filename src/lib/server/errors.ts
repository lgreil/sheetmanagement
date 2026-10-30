import { cleanReport, type ErrorSource } from '#lib/errors/errors.ts';
import { getStore } from './db/index.ts';

/**
 * The error log (#191) on the server: each error counted by kind in D1, without who it happened
 * to. Never throws: a broken log must not turn one error into two.
 */
export async function recordError(report: { source: ErrorSource; place?: unknown; message?: unknown; status?: unknown }): Promise<void> {
	const clean = cleanReport(report);
	if (!clean) return;
	try {
		await getStore().logError(clean);
	} catch (cause) {
		console.error('error log', cause);
	}
}

/** What an error says, whatever was thrown. */
export function messageOf(error: unknown): string {
	if (error instanceof Error) return `${error.name === 'Error' ? '' : `${error.name}: `}${error.message}`;
	return typeof error === 'string' ? error : String(error);
}
