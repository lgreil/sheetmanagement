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
		// files.get for a single folder (its name)
		const single = url.pathname.match(/\/files\/([^/]+)$/)?.[1];
		if (single) return Response.json(files.find((f) => f.id === decodeURIComponent(single)));
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

const options = { archiveFolderId: 'archive', categoryFolderPattern: bachkreis.naming.categoryFolderPattern };

describe('buildDriveIndex', () => {
	const tree: DriveFile[] = [
		folder('p-bach', 'Bach BWV 147 - Jesu bleibet meine Freude', 'archive'),
		folder('p-superman', 'Superman Returns', 'archive'),
		folder('c-xmas', '00 | Weihnachtsstücke', 'archive'),
		file('loose', 'Notizen.pdf', 'archive'),

		folder('p-sleigh', 'Sleigh Ride', 'c-xmas'),
		file('xmas-plan', 'Ablaufplan-Weihnachten.pdf', 'c-xmas'),
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
		const index = await buildDriveIndex(fakeDrive(tree), options);

		expect(index.pieces.map((p) => [p.name, p.category ?? null, p.files.map((f) => f.name)])).toEqual([
			['Bach BWV 147 - Jesu bleibet meine Freude', null, ['@BWV 147 - Partitur.pdf', 'BWV 147 - Geige I.pdf']],
			['Last Christmas', 'Weihnachtsstücke', ['Last Christmas - Flöte.pdf']],
			['Sleigh Ride', 'Weihnachtsstücke', ['Sleigh Ride - Horn I.pdf']],
			['Superman Returns', null, ['Superman Returns - Partitur - FEHLT']]
		]);
		expect(index.pieces.find((p) => p.name === 'Last Christmas')?.folderId).toBe('p-last');
		expect(index.pieces.find((p) => p.name === 'Sleigh Ride')?.files[0]).toMatchObject({ subfolder: 'Sections', subfolderId: 's-sections' });
		expect(index.categoryFiles).toEqual([
			{ category: 'Weihnachtsstücke', files: [expect.objectContaining({ id: 'xmas-plan', name: 'Ablaufplan-Weihnachten.pdf' })] }
		]);
		expect(index.pieces.find((p) => p.name === 'Superman Returns')?.files[0].mimeType).toBe(DOC);
	});

	it('stays within the Workers subrequest limit for a large archive', async () => {
		const big: DriveFile[] = [];
		for (let i = 0; i < 150; i++) {
			big.push(folder(`piece-${i}`, `Stück ${i}`, 'archive'));
			for (let j = 0; j < 15; j++) big.push(file(`file-${i}-${j}`, `Stück ${i} - Stimme ${j}.pdf`, `piece-${i}`));
		}
		const client = fakeDrive(big);
		const index = await buildDriveIndex(client, options);

		expect(index.pieces).toHaveLength(150);
		expect(index.pieces.every((p) => p.files.length === 15)).toBe(true);
		// 1 request for the archive + one per batch of piece folders.
		expect(index.requestCount).toBe(1 + Math.ceil(150 / PARENTS_PER_QUERY));
		expect(index.requestCount).toBeLessThan(50);
	});
});

describe('current programmes', () => {
	const shortcut = (id: string, name: string, parent: string, targetId: string): DriveFile => ({
		id,
		name,
		mimeType: SHORTCUT_MIME,
		parents: [parent],
		shortcutDetails: { targetId, targetMimeType: FOLDER_MIME }
	});
	const tree: DriveFile[] = [
		folder('p-bach', 'Bach BWV 147 - Jesu bleibet meine Freude', 'archive'),
		file('f1', 'BWV 147 - Geige I.pdf', 'p-bach'),

		folder('prog-a', 'Programm A-Orchester', 'current'),
		folder('prog-b', 'Programm B-Orchester', 'current'),
		folder('prog-eo', 'Programm Ehemaligenorchester', 'current'),

		folder('p-fame', 'Fame', 'prog-a'),
		file('f2', 'Fame - Flöte.pdf', 'p-fame'),
		// Played from the archive: same folder, linked.
		shortcut('s-bach', 'Bach BWV 147 - Jesu bleibet meine Freude', 'prog-a', 'p-bach'),
		folder('p-b1', 'Pirates of the Caribbean', 'prog-b'),
		folder('p-gliere', 'Gliere Op. 70 - Russian Sailors Dance', 'prog-eo'),
		file('f3', 'Russian Sailors Dance - Partitur.pdf', 'p-gliere'),
		// The EO plays the A-Orchester's programme too.
		shortcut('s-a', 'Programm A-Orchester', 'prog-eo', 'prog-a')
	];
	const programOptions = {
		...options,
		programFolderIds: ['prog-a', 'prog-b', 'prog-eo'],
		programFolderPattern: bachkreis.naming.programFolderPattern
	};

	it('tags pieces with every programme they are in, including linked programmes', async () => {
		const index = await buildDriveIndex(fakeDrive(tree), programOptions);
		const programsOf = (name: string) => index.pieces.find((p) => p.name === name)?.programs;

		expect(index.programs).toEqual(['A-Orchester', 'B-Orchester', 'Ehemaligenorchester']);
		expect(programsOf('Fame')).toEqual(['A-Orchester', 'Ehemaligenorchester']);
		expect(programsOf('Gliere Op. 70 - Russian Sailors Dance')).toEqual(['Ehemaligenorchester']);
		expect(programsOf('Pirates of the Caribbean')).toEqual(['B-Orchester']);
		// An archive piece in a programme stays one piece, with its files, and gets the tags.
		const bach = index.pieces.filter((p) => p.folderId === 'p-bach');
		expect(bach).toHaveLength(1);
		expect(bach[0].programs).toEqual(['A-Orchester', 'Ehemaligenorchester']);
		expect(bach[0].files.map((f) => f.name)).toEqual(['BWV 147 - Geige I.pdf']);
		// Programme pieces get their files like archive pieces.
		expect(index.pieces.find((p) => p.name === 'Fame')?.files.map((f) => f.name)).toEqual(['Fame - Flöte.pdf']);
	});

	it('does not tag pieces with a parent folder that only groups programmes', async () => {
		const grouped: DriveFile[] = [
			folder('current', '01 | Aktuelles Programm', 'root'),
			folder('prog-a', 'Programm A-Orchester', 'current'),
			folder('p-fame', 'Fame', 'prog-a'),
			folder('p-loose', 'Viva la Vida', 'current')
		];
		const index = await buildDriveIndex(fakeDrive(grouped), {
			...programOptions,
			programFolderIds: ['current']
		});
		expect(index.pieces.find((p) => p.name === 'Fame')?.programs).toEqual(['A-Orchester']);
		expect(index.pieces.find((p) => p.name === 'Viva la Vida')?.programs).toEqual(['Aktuelles Programm']);
	});

	it('ends when programme folders link to each other in a circle', async () => {
		const circle: DriveFile[] = [
			folder('prog-a', 'Programm A-Orchester', 'current'),
			folder('prog-b', 'Programm B-Orchester', 'current'),
			shortcut('a-to-b', 'Programm B-Orchester', 'prog-a', 'prog-b'),
			shortcut('b-to-a', 'Programm A-Orchester', 'prog-b', 'prog-a'),
			folder('p-fame', 'Fame', 'prog-a')
		];
		const index = await buildDriveIndex(fakeDrive(circle), { ...programOptions, programFolderIds: ['prog-a', 'prog-b'] });
		expect(index.pieces.find((p) => p.name === 'Fame')?.programs).toEqual(['A-Orchester', 'B-Orchester']);
		expect(index.requestCount).toBeLessThan(15);
	});
});
