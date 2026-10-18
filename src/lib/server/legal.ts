import { config } from '#lib/config/index.ts';
import { appEnv } from './env.ts';

/** Who runs this deployment, for the privacy notice and terms of use. */
export function legalContact() {
	const env = appEnv();
	return {
		name: env.LEGAL_NAME?.trim() || env.ORCHESTRA_NAME?.trim() || config.name,
		address: env.LEGAL_ADDRESS?.trim() || undefined,
		email: env.LEGAL_EMAIL?.trim() || undefined
	};
}
export type LegalContact = ReturnType<typeof legalContact>;
