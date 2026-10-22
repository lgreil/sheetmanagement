// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Access } from '#lib/access/access.ts';

declare global {
	/** The version in package.json, set by Vite at build time. */
	const __APP_VERSION__: string;
	/** The app's language, from APP_LANGUAGE at build time (#124). */
	const __LANGUAGE__: 'de' | 'en';

	namespace App {
		// interface Error {}
		interface Locals {
			/** Whether Google sign-in is configured; see authConfig(). */
			auth: 'on' | 'off';
			access: Access;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
