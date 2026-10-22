import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

// `pnpm dev:demo` (vite --mode demo) runs the demo: [env.demo] in wrangler.toml, with local
// settings from .dev.vars.demo instead of .dev.vars.
export default defineConfig(({ mode }) => ({
	plugins: [
		sveltekit({
			adapter: adapter({ platformProxy: { environment: mode === 'demo' ? 'demo' : undefined } }),
			// An open app notices a deploy within a few minutes and offers "Neu laden" (#140).
			version: { pollInterval: 5 * 60 * 1000 }
		})
	],
	// Shown next to the source link and on /status.
	define: { __APP_VERSION__: JSON.stringify(pkg.version) },
	test: {
		include: ['src/**/*.test.ts']
	}
}));
