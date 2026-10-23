import { describe, expect, it, vi } from 'vitest';

const env: Record<string, string> = {};
vi.mock('./env.ts', () => ({ appEnv: () => env, isDemo: () => false }));
vi.mock('./legal.ts', () => ({ legalContact: () => ({ name: 'Orchester', email: env.LEGAL_EMAIL, address: env.LEGAL_ADDRESS }) }));
vi.mock('./push/index.ts', () => ({ pushReady: () => !!env.VAPID_PUBLIC_KEY }));
vi.mock('./services.ts', () => ({ driveWriteEnabled: () => env.DRIVE_WRITE === 'true' }));
vi.mock('./db/index.ts', () => ({ getStore: () => ({ kind: 'memory' }) }));

const { extras } = await import('./extras.ts');
const states = () => Object.fromEntries(extras().map((extra) => [extra.key, extra.state]));

describe('extras', () => {
	it('lists what is missing, each with its part of the guide', () => {
		expect(states()).toEqual({
			currentProgram: 'off',
			driveWrite: 'off',
			youtube: 'off',
			push: 'off',
			database: 'off',
			legal: 'off',
			email: 'planned'
		});
		expect(extras().find((extra) => extra.key === 'youtube')?.guide).toMatch(/setup-google\.md#youtube-durations$/);
	});

	it('follows the settings; email stays planned', () => {
		Object.assign(env, { YOUTUBE_API_KEY: 'key', DRIVE_WRITE: 'true', VAPID_PUBLIC_KEY: 'k', LEGAL_EMAIL: 'a@b.org', LEGAL_ADDRESS: 'Weg 1' });
		expect(states()).toMatchObject({ youtube: 'on', driveWrite: 'on', push: 'on', legal: 'on', email: 'planned' });
	});
});
