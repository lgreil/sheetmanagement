import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./env.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('./env.ts')>()),
	appEnv: () => ({ DEMO: 'true' }),
	isDemo: () => true,
	runInBackground: (promise: Promise<unknown>) => void promise.catch(() => {})
}));

const { demoClient, resetDemo } = await import('./demo/backend.ts');
const { listChildren } = await import('./google/drive.ts');
const { getLibrary, programOf } = await import('./library.ts');
const { getArchiveIndex, programFolderIds } = await import('./services.ts');
const { syncCurrentProgram } = await import('./current-program.ts');

beforeEach(async () => {
	resetDemo();
	await getArchiveIndex({ force: true });
});

/** The pieces a programme folder links to, by their archive folder ids. */
async function linked(folderUrl: string): Promise<string[]> {
	const id = folderUrl.split('/').pop()!;
	return (await listChildren(demoClient(), [id])).flatMap((entry) => (entry.shortcutDetails ? [entry.shortcutDetails.targetId] : [])).sort();
}

describe('syncCurrentProgram', () => {
	// Saving a programme two orchestras play syncs both folders in one call; the free plan
	// allows 50 Google requests per call, and the second orchestra's folder used to stop half-way.
	it('fills two orchestras’ folders in one call, within the free plan’s requests', async () => {
		const library = await getLibrary();
		const concert = library.concerts.find((c) => c.orchestras.length > 1 && !c.event?.past && c.program.length);
		expect(concert).toBeDefined();
		// Drive requests only: the page data loaded above refreshes the sheet in the background.
		const client = demoClient() as unknown as { fetchImpl: typeof fetch };
		const fetchImpl = client.fetchImpl;
		let driveRequests = 0;
		client.fetchImpl = (input, init) => {
			if (String(input).includes('/drive/v3/')) driveRequests++;
			return fetchImpl(input, init);
		};
		const results = [];
		for (const orchestra of concert!.orchestras) results.push(await syncCurrentProgram(concert!, library, orchestra));
		client.fetchImpl = fetchImpl;
		// Reading the programme folders (and making one), then one request per shortcut; nothing
		// that grows with the archive: crawling it again after each orchestra used up the rest.
		const changes = results.reduce((sum, result) => sum + result.added.length + result.removed.length + result.stuck.length, 0);
		expect(driveRequests).toBeLessThanOrEqual(changes + results.length * (programFolderIds().length + 3));

		for (const result of results) {
			const wanted = programOf(concert!, result.orchestra).flatMap((item) => (item.pieceId && library.piecesById.get(item.pieceId)?.detail ? [item.pieceId] : []));
			expect(await linked(result.folderUrl)).toEqual([...new Set(wanted)].sort());
		}

		// The cached archive knows the new links without crawling Drive again.
		const index = (await getArchiveIndex()).value;
		for (const result of results) {
			const program = result.folderName.replace(/^Programm /, '');
			const inIndex = index.pieces.filter((piece) => piece.programs?.includes(program)).map((piece) => piece.folderId).sort();
			expect(inIndex).toEqual(await linked(result.folderUrl));
		}
	});
});
