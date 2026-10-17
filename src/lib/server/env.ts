import { env } from 'cloudflare:workers';

/**
 * Deployment settings. Set them with `wrangler secret put <NAME>` in production
 * and in `.dev.vars` locally; see `.dev.vars.example`.
 */
export interface AppEnv {
	ORCHESTRA_NAME?: string;
	ORCHESTRA_SHORT_NAME?: string;
}

export function appEnv(): AppEnv {
	return env as unknown as AppEnv;
}
