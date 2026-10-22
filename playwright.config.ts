import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against the demo (#142): sample data in memory, no Google account.
 * `pnpm test:e2e` starts the demo on its own port; the tests reset its data first.
 */
const PORT = 4319;

export default defineConfig({
	testDir: 'e2e',
	// One demo, one set of data in memory: the tests run one after another.
	workers: 1,
	fullyParallel: false,
	retries: process.env.CI ? 1 : 0,
	timeout: 60_000,
	expect: { timeout: 15_000 },
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
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
	webServer: {
		command: `pnpm exec vite dev --mode demo --port ${PORT} --strictPort`,
		url: `http://localhost:${PORT}/api/health`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
