import { defineConfig, devices } from '@playwright/test';

import { DEMO_PORT, DEMO_SERVERS } from './e2e/ports.ts';

/**
 * End-to-end tests against the demo (#142): sample data in memory, no Google account.
 * `pnpm test:e2e` starts the demo on its own ports; the tests reset its data first.
 */

export default defineConfig({
	testDir: 'e2e',
	// The demo keeps its data in memory, one set per server: each worker gets a demo of its own
	// (e2e/demo.ts), so the tests run side by side without touching each other's data.
	workers: DEMO_SERVERS,
	fullyParallel: true,
	retries: process.env.CI ? 1 : 0,
	timeout: 60_000,
	expect: { timeout: 15_000 },
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		locale: 'de-DE',
		timezoneId: 'Europe/Berlin',
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
		// The tests check pages, not the offline cache.
		serviceWorkers: 'block'
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'phone', use: { ...devices['Pixel 7'] } }
	],
	webServer: Array.from({ length: DEMO_SERVERS }, (_, index) => ({
		command: `pnpm exec vite dev --mode demo --port ${DEMO_PORT + index} --strictPort`,
		url: `http://localhost:${DEMO_PORT + index}/api/health`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}))
});
