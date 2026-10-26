// The commit a build is made from (#206), for vite.config.ts: GitHub Actions says it, a local
// build asks git. Empty without either, e.g. when built from a downloaded zip.
import { execSync } from 'node:child_process';

export function commit() {
	if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
	try {
		return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
	} catch {
		return '';
	}
}
