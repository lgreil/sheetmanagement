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

/** An empty Google Doc in a folder, e.g. the placeholder "<Titel> - <Stimme> - FEHLT". */
export function createGoogleDoc(client: GoogleClient, name: string, folderId: string): Promise<DriveFile> {
	return client.request<DriveFile>(FILES_URL, {
		method: 'POST',
		params: { fields: 'id, name', supportsAllDrives: true },
		body: { name, mimeType: 'application/vnd.google-apps.document', parents: [folderId] }
	});
}

/** A folder inside another, e.g. "Programm A-Orchester" in the current-programme folder (#60). */
export function createFolder(client: GoogleClient, name: string, parentId: string): Promise<DriveFile> {
	return client.request<DriveFile>(FILES_URL, {
		method: 'POST',
		params: { fields: 'id, name', supportsAllDrives: true },
		body: { name, mimeType: FOLDER_MIME, parents: [parentId] }
	});
}

/** A shortcut to a folder or file, as people make them by hand with "Verknüpfung hinzufügen". */
export function createShortcut(client: GoogleClient, name: string, targetId: string, parentId: string): Promise<DriveFile> {
	return client.request<DriveFile>(FILES_URL, {
		method: 'POST',
		params: { fields: 'id, name', supportsAllDrives: true },
		body: { name, mimeType: SHORTCUT_MIME, parents: [parentId], shortcutDetails: { targetId } }
	});
}

/** Into the bin, not deleted: whoever owns it can take it out again for 30 days. */
export function trashFile(client: GoogleClient, fileId: string): Promise<DriveFile> {
	return client.request<DriveFile>(`${FILES_URL}/${encodeURIComponent(fileId)}`, {
		method: 'PATCH',
		params: { fields: 'id, name', supportsAllDrives: true },
		body: { trashed: true }
	});
}

/** A file's content (e.g. a PDF), as a response to stream on. */
export function downloadFile(client: GoogleClient, fileId: string): Promise<Response> {
	return client.fetchRaw(`${FILES_URL}/${encodeURIComponent(fileId)}`, { alt: 'media', supportsAllDrives: true });
}

const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

/**
 * A new file with its content in one request (Drive's multipart upload, up to 5 MB), for what
 * the Worker writes itself, such as the weekly backup (#186). Larger files go via startUpload().
 */
export function uploadFile(
	client: GoogleClient,
	file: { name: string; mimeType: string; folderId: string; content: string }
): Promise<DriveFile> {
	const boundary = `noten-${crypto.randomUUID()}`;
	const metadata = { name: file.name, mimeType: file.mimeType, parents: [file.folderId] };
	const body = new Blob(
		[
			`--${boundary}\r\ncontent-type: application/json; charset=utf-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
			`--${boundary}\r\ncontent-type: ${file.mimeType}\r\n\r\n${file.content}\r\n--${boundary}--`
		],
		{ type: `multipart/related; boundary=${boundary}` }
	);
	return client.request<DriveFile>(UPLOAD_URL, {
		method: 'POST',
		params: { uploadType: 'multipart', supportsAllDrives: true, fields: 'id, name, mimeType' },
		body
	});
}

/**
 * Opens a resumable upload (#193) and returns its session address. The browser sends the
 * file there itself, so it never passes through the Worker; the address is the permission,
 * and Google lets the page's origin use it. With `replaceId`, the upload is a new revision
 * of that file (history kept in Drive), else a new file in `folderId`.
 */
export async function startUpload(
	client: GoogleClient,
	file: { name: string; mimeType: string; size: number; folderId: string; replaceId?: string },
	origin: string
): Promise<string> {
	const replace = file.replaceId ? `/${encodeURIComponent(file.replaceId)}` : '';
	const response = await client.send(UPLOAD_URL + replace, {
		method: replace ? 'PATCH' : 'POST',
		params: { uploadType: 'resumable', supportsAllDrives: true, fields: 'id, name, mimeType' },
		body: replace ? { name: file.name } : { name: file.name, mimeType: file.mimeType, parents: [file.folderId] },
		headers: { origin, 'x-upload-content-type': file.mimeType, 'x-upload-content-length': String(file.size) }
	});
	const location = response.headers.get('location');
	if (!location) throw new Error('Drive opened no upload session');
	return location;
}
