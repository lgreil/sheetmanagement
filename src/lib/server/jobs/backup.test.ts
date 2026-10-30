import { describe, expect, it, vi } from 'vitest';

vi.mock('../data-source.ts', () => ({ usingD1: vi.fn() }));
vi.mock('../data-transfer.ts', () => ({ allData: vi.fn() }));
vi.mock('../drive-account.ts', () => ({ driveAccountClient: vi.fn() }));
vi.mock('../env.ts', () => ({ appEnv: () => ({}) }));
vi.mock('../members.ts', () => ({ today: () => '2026-10-30' }));
vi.mock('../services.ts', () => ({ driveWriteEnabled: () => false, getGoogle: vi.fn() }));

const { backupName, oldBackups } = await import('./backup.ts');

const file = (name: string, modifiedTime?: string) => ({ id: name + (modifiedTime ?? ''), name, mimeType: 'application/json', modifiedTime });

describe('oldBackups', () => {
	it('keeps the newest backups and leaves other files alone', () => {
		const weeks = ['2026-09-04', '2026-09-11', '2026-09-18', '2026-09-25', '2026-10-02'].map((day) => file(backupName(day)));
		const others = [file('Notizen.txt'), file('daten-alt.json')];
		expect(oldBackups([...others, ...weeks], 3).map((f) => f.name)).toEqual(['daten-2026-09-11.json', 'daten-2026-09-04.json']);
	});

	it('counts two backups of the same day twice, the older one first to go', () => {
		const files = [file('daten-2026-10-30.json', '2026-10-30T08:00:00Z'), file('daten-2026-10-30.json', '2026-10-30T20:00:00Z'), file('daten-2026-10-23.json')];
		expect(oldBackups(files, 1).map((f) => f.id)).toEqual(['daten-2026-10-30.json2026-10-30T08:00:00Z', 'daten-2026-10-23.json']);
	});

	it('trashes nothing while there are fewer than it keeps', () => {
		expect(oldBackups([file('daten-2026-10-30.json')])).toEqual([]);
	});
});
