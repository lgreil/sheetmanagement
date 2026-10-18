import type { NamingRules } from '#lib/config/types.ts';
import type { PartStatus } from './types.ts';

export type MarkableStatus = Exclude<PartStatus, 'ok'>;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A trailing " - FEHLT", " - LEER" or " - UNVOLLSTÄNDIG" before the extension, any case. */
function trailingStatus(naming: NamingRules): RegExp {
	const words = Object.values(naming.status).map(escape).join('|');
	return new RegExp(`\\s*-\\s*(${words})\\s*$`, 'i');
}

function split(fileName: string): [string, string] {
	const extension = /\.[a-z0-9]{2,4}$/i.exec(fileName)?.[0] ?? '';
	return [fileName.slice(0, fileName.length - extension.length), extension];
}

/**
 * The file name with the convention's status word at the end ("Elegie - Viola - LEER.pdf"),
 * replacing a status word that is already there.
 */
export function withStatusWord(fileName: string, status: MarkableStatus, naming: NamingRules): string {
	const [base, extension] = split(fileName);
	return `${base.replace(trailingStatus(naming), '')}${naming.separator}${naming.status[status]}${extension}`;
}

/** The file name without the given trailing status word; unchanged if it isn't there. */
export function withoutStatusWord(fileName: string, status: MarkableStatus, naming: NamingRules): string {
	const [base, extension] = split(fileName);
	const match = trailingStatus(naming).exec(base);
	if (!match || match[1].toLowerCase() !== naming.status[status].toLowerCase()) return fileName;
	return base.slice(0, match.index) + extension;
}
