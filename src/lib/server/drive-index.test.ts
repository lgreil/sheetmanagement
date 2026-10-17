import { describe, expect, it } from 'vitest';
import { bachkreis } from '#lib/config/presets/bachkreis.ts';
import { buildDriveIndex } from './drive-index.ts';
import { GoogleClient } from './google/client.ts';
import { FOLDER_MIME, PARENTS_PER_QUERY, SHORTCUT_MIME, type DriveFile } from './google/drive.ts';

const PDF = 'application/pdf';
const DOC = 'application/vnd.google-apps.document';

/** A fake Drive that answers `'<id>' in parents or …` queries from a flat file list. */
function fakeDrive(files: DriveFile[]) {
	const fetchImpl = async (input: string | URL) => {
		const url = new URL(input);
		const parents = [...(url.searchParams.get('q') ?? '').matchAll(/'([^']+)' in parents/g)].map((m) => m[1]);
		const matches = files.filter((f) => f.parents?.some((p) => parents.includes(p)));
		return Response.json({ files: matches });
	};
	return new GoogleClient({ getToken: async () => 'token' }, fetchImpl as typeof fetch);
}

const folder = (id: string, name: string, parent: string): DriveFile => ({
	id,
	name,
	mimeType: FOLDER_MIME,
	parents: [parent]
});
const file = (id: string, name: string, parent: string, mimeType = PDF): DriveFile => ({
	id,
	name,
	mimeType,
	parents: [parent]
});

describe('buildDriveIndex', () => {
	const tree: DriveFile[] = [
		folder('p-bach', 'Bach BWV 147 - Jesu bleibet meine Freude', 'archive'),
		folder('p-superman', 'Superman Returns', 'archive'),
		folder('c-xmas', '00 | Weihnachtsstücke', 'archive'),
		file('loose', 'Notizen.pdf', 'archive'),

		folder('p-sleigh', 'Sleigh Ride', 'c-xmas'),
		{
			id: 'shortcut-1',
			name: 'Last Christmas',
			mimeType: SHORTCUT_MIME,
			parents: ['c-xmas'],
			shortcutDetails: { targetId: 'p-last', targetMimeType: FOLDER_MIME }
		},

		file('f1', '@BWV 147 - Partitur.pdf', 'p-bach'),
		file('f2', 'BWV 147 - Geige I.pdf', 'p-bach'),
		file('f3', 'Superman Returns - Partitur - FEHLT', 'p-superman', DOC),
		folder('s-sections', 'Sections', 'p-sleigh'),
		file('f4', 'Sleigh Ride - Horn I.pdf', 's-sections'),
		file('f5', 'Last Christmas - Flöte.pdf', 'p-last')
	];

	it('finds pieces, categories, shortcut folders and subfolder files', async () => {
		const index = await buildDriveIndex(fakeDrive(tree), 'archive', bachkreis.naming.categoryFolderPattern);

		expect(index.pieces.map((p) => [p.name, p.category ?? null, p.files.map((f) => f.name)])).toEqual([
			['Bach BWV 147 - Jesu bleibet meine Freude', null, ['@BWV 147 - Partitur.pdf', 'BWV 147 - Geige I.pdf']],
			['Last Christmas', 'Weihnachtsstücke', ['Last Christmas - Flöte.pdf']],
			['Sleigh Ride', 'Weihnachtsstücke', ['Sleigh Ride - Horn I.pdf']],
			['Superman Returns', null, ['Superman Returns - Partitur - FEHLT']]
		]);
		expect(index.pieces.find((p) => p.name === 'Last Christmas')?.folderId).toBe('p-last');
		expect(index.pieces.find((p) => p.name === 'Sleigh Ride')?.files[0].subfolder).toBe('Sections');
		expect(index.pieces.find((p) => p.name === 'Superman Returns')?.files[0].mimeType).toBe(DOC);
	});

	it('stays within the Workers subrequest limit for a large archive', async () => {
		const big: DriveFile[] = [];
		for (let i = 0; i < 150; i++) {
			big.push(folder(`piece-${i}`, `Stück ${i}`, 'archive'));
			for (let j = 0; j < 15; j++) big.push(file(`file-${i}-${j}`, `Stück ${i} - Stimme ${j}.pdf`, `piece-${i}`));
		}
		const client = fakeDrive(big);
		const index = await buildDriveIndex(client, 'archive', bachkreis.naming.categoryFolderPattern);

		expect(index.pieces).toHaveLength(150);
		expect(index.pieces.every((p) => p.files.length === 15)).toBe(true);
		// 1 request for the archive + one per batch of piece folders.
		expect(index.requestCount).toBe(1 + Math.ceil(150 / PARENTS_PER_QUERY));
		expect(index.requestCount).toBeLessThan(50);
	});
});
