import { config } from '#lib/config/index.ts';
import { appEnv } from '#lib/server/env.ts';

export function load() {
	const env = appEnv();
	const name = env.ORCHESTRA_NAME?.trim();
	return {
		orchestraName: name || config.name,
		// A custom name without a custom short name shouldn't fall back to the preset's short name.
		orchestraShortName: env.ORCHESTRA_SHORT_NAME?.trim() || name || config.shortName
	};
}
