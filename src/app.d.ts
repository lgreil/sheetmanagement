// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Access } from '#lib/access/access.ts';

declare global {
	/** The version in package.json, set by Vite at build time. */
	const __APP_VERSION__: string;

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
