import { appEnv, orchestra } from './env.ts';

/** Who runs this deployment, for the privacy notice and terms of use. */
export function legalContact() {
	const env = appEnv();
	return {
		name: env.LEGAL_NAME?.trim() || orchestra().name,
		address: env.LEGAL_ADDRESS?.trim() || undefined,
		email: env.LEGAL_EMAIL?.trim() || undefined
	};
}
export type LegalContact = ReturnType<typeof legalContact>;
