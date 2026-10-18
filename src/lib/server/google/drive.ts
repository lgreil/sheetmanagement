import type { GoogleClient } from './client.ts';

const FILES_URL = 'https://www.googleapis.com/drive/v3/files';

export const FOLDER_MIME = 'application/vnd.google-apps.folder';
export const SHORTCUT_MIME = 'application/vnd.google-apps.shortcut';

export interface DriveFile {
	id: string;
	name: string;
	mimeType: string;
	modifiedTime?: string;
	size?: string;
	parents?: string[];
	shortcutDetails?: { targetId: string; targetMimeType: string };
}

interface FileListPage {
	files?: DriveFile[];
	nextPageToken?: string;
}

const FIELDS =
	'nextPageToken, files(id, name, mimeType, modifiedTime, size, parents, shortcutDetails(targetId, targetMimeType))';

/**
 * Drive's query language has no "descendants of" filter, and Workers on the free plan
 * may make only 50 requests per invocation. So children of many folders are listed in
 * one query (`'a' in parents or 'b' in parents …`), in batches of this size.
 */
export const PARENTS_PER_QUERY = 40;

/**
 * A string literal for Drive's query language. Backslashes are escaped first, then
 * quotes; otherwise a trailing backslash would escape the closing quote.
 */
export function queryString(value: string): string {
	return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Lists the direct children of many folders with as few requests as possible. */
export async function listChildren(client: GoogleClient, folderIds: string[]): Promise<DriveFile[]> {
	const files: DriveFile[] = [];
	for (let i = 0; i < folderIds.length; i += PARENTS_PER_QUERY) {
		const batch = folderIds.slice(i, i + PARENTS_PER_QUERY);
		const parents = batch.map((id) => `${queryString(id)} in parents`).join(' or ');
		files.push(
			...(await client.paginate<FileListPage, DriveFile>(
				FILES_URL,
				{
					q: `(${parents}) and trashed = false`,
					fields: FIELDS,
					pageSize: 1000,
					orderBy: 'name',
					supportsAllDrives: true,
					includeItemsFromAllDrives: true
				},
				(page) => page.files
			))
		);
	}
	return files;
}

/** Whether a file is a folder, or a shortcut pointing to one. */
export function isFolderLike(file: DriveFile): boolean {
	return (
		file.mimeType === FOLDER_MIME ||
		(file.mimeType === SHORTCUT_MIME && file.shortcutDetails?.targetMimeType === FOLDER_MIME)
	);
}

/** The id to use for a file's content: the target for shortcuts, else its own id. */
export function contentId(file: DriveFile): string {
	return file.mimeType === SHORTCUT_MIME && file.shortcutDetails ? file.shortcutDetails.targetId : file.id;
}

export function getFile(client: GoogleClient, fileId: string): Promise<DriveFile> {
	return client.request<DriveFile>(`${FILES_URL}/${encodeURIComponent(fileId)}`, {
		params: { fields: 'id, name, mimeType, modifiedTime', supportsAllDrives: true }
	});
}

/** Adds a comment to a file (shown in Drive's comment panel). Returns the comment id. */
export async function createComment(client: GoogleClient, fileId: string, content: string): Promise<string> {
	const comment = await client.request<{ id: string }>(`${FILES_URL}/${encodeURIComponent(fileId)}/comments`, {
		method: 'POST',
		params: { fields: 'id' },
		body: { content }
	});
	return comment.id;
}

/** Resolves or reopens a comment with a reply, as a person would in Drive. */
export async function replyToComment(
	client: GoogleClient,
	fileId: string,
	commentId: string,
	action: 'resolve' | 'reopen',
	content: string
): Promise<void> {
	await client.request(
		`${FILES_URL}/${encodeURIComponent(fileId)}/comments/${encodeURIComponent(commentId)}/replies`,
		{ method: 'POST', params: { fields: 'id' }, body: { action, content } }
	);
}

export function renameFile(client: GoogleClient, fileId: string, name: string): Promise<DriveFile> {
	return client.request<DriveFile>(`${FILES_URL}/${encodeURIComponent(fileId)}`, {
		method: 'PATCH',
		params: { fields: 'id, name', supportsAllDrives: true },
		body: { name }
	});
}

/** A file's content (e.g. a PDF), as a response to stream on. */
export function downloadFile(client: GoogleClient, fileId: string): Promise<Response> {
	return client.fetchRaw(`${FILES_URL}/${encodeURIComponent(fileId)}`, { alt: 'media', supportsAllDrives: true });
}
