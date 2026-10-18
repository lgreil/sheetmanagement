// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Access } from '#lib/access/access.ts';

declare global {
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
