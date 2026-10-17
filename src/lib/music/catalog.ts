import type { OrchestraConfig } from '#lib/config/index.ts';
import type { DriveIndex, IndexedPiece } from '#lib/server/drive-index.ts';
import { createInstrumentMatcher, parsePartName, type InstrumentMatcher } from './part-name.ts';
import { parsePieceName } from './piece-name.ts';
import { searchText, sharedPrefix } from './text.ts';
import type { Part, PieceDetail, PieceStatus } from './types.ts';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

function buildPiece(piece: IndexedPiece, config: OrchestraConfig, matcher: InstrumentMatcher): PieceDetail {
	const { featuredPrefix } = config.naming;
	const withoutFeatured = (name: string) =>
		name.startsWith(featuredPrefix) ? name.slice(featuredPrefix.length).trim() : name;
	const prefix = sharedPrefix(piece.files.map((file) => withoutFeatured(file.name)));

	const parts: Part[] = piece.files
		.filter((file) => file.mimeType !== FOLDER_MIME)
		.map((file) => {
			const parsed = parsePartName(file.name, file.mimeType, config.naming, matcher, prefix);
			return {
				id: file.id,
				fileName: file.name,
				label: parsed.label,
				kind: parsed.kind,
				family: parsed.family,
				instruments: parsed.instruments,
				notes: parsed.notes,
				status: parsed.status,
				mimeType: file.mimeType,
				...(file.subfolder ? { subfolder: file.subfolder } : {}),
				order: parsed.order
			};
		})
		.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'de', { numeric: true }));

	const real = parts.filter((part) => part.kind !== 'audio' && part.kind !== 'sonstiges');
	const status: PieceStatus =
		real.length === 0
			? 'empty'
			: real.some((part) => part.status === 'missing')
				? 'missing'
				: real.some((part) => part.status === 'empty' || part.status === 'incomplete')
					? 'incomplete'
					: 'ok';

	const name = parsePieceName(piece.name, config.naming);
	return {
		id: piece.folderId,
		folderName: piece.name,
		title: name.title,
		composer: name.composer,
		catalogue: name.catalogue,
		category: piece.category,
		partCount: real.filter((part) => part.status !== 'missing').length,
		status,
		search: searchText(name.title, name.composer, name.catalogue, piece.category, piece.name),
		parts
	};
}

export interface Catalog {
	pieces: PieceDetail[];
	byId: Map<string, PieceDetail>;
}

export function buildCatalog(index: DriveIndex, config: OrchestraConfig): Catalog {
	const matcher = createInstrumentMatcher(config.instruments);
	const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });
	const pieces = index.pieces
		.map((piece) => buildPiece(piece, config, matcher))
		.sort((a, b) => collator.compare(a.title, b.title));
	return { pieces, byId: new Map(pieces.map((piece) => [piece.id, piece])) };
}
