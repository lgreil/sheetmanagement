// Minimal typing for the Workers runtime module we use. Kept by hand instead of
// `wrangler types`, whose generated file pulls the build output into type checks.
declare module 'cloudflare:workers' {
	export const env: Record<string, unknown>;
}
