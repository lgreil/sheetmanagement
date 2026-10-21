import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
	plugins: [sveltekit({ adapter: adapter() })],
	// Shown next to the source link and on /status.
	define: { __APP_VERSION__: JSON.stringify(pkg.version) },
	test: {
		include: ['src/**/*.test.ts']
	}
});
