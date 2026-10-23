/** The demo servers for the end-to-end tests: one per worker, on ports from DEMO_PORT up. */
export const DEMO_PORT = 4319;
export const DEMO_SERVERS = Number(process.env.E2E_WORKERS) || 3;
