/**
 * How many pages a PDF has, read on the server without a PDF library (#93): those cost
 * more CPU than the free plan allows. The page tree's /Count is enough, in the file or,
 * from PDF 1.5 on, in its compressed object streams. Null when the file isn't a PDF.
 */

const PAGE = /\/Type\s*\/Page(?![A-Za-z])/g;
// The page tree's root is the /Pages dictionary with the largest /Count.
const PAGES_COUNT = /\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)|\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages\b/g;

/** Bytes as text, one character per byte, so positions in the text are positions in the file. */
function latin1(bytes: Uint8Array): string {
	let text = '';
	for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return text;
}

async function inflate(bytes: Uint8Array): Promise<string> {
	const stream = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream('deflate'));
	return latin1(new Uint8Array(await new Response(stream).arrayBuffer()));
}

/** The content of each compressed object stream: where PDF 1.5+ files keep their dictionaries. */
async function objectStreams(text: string, bytes: Uint8Array): Promise<string[]> {
	const found: string[] = [];
	for (const match of text.matchAll(/\/Type\s*\/ObjStm\b/g)) {
		const start = text.lastIndexOf('obj', match.index);
		const keyword = text.indexOf('stream', match.index);
		if (start < 0 || keyword < 0) continue;
		const dictionary = text.slice(start, keyword);
		if (!/\/Filter\s*\/FlateDecode/.test(dictionary) || /\/DecodeParms/.test(dictionary)) continue;
		let from = keyword + 'stream'.length;
		if (text[from] === '\r') from++;
		if (text[from] === '\n') from++;
		const length = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dictionary);
		const to = length ? from + Number(length[1]) : text.indexOf('endstream', from);
		if (to <= from) continue;
		found.push(await inflate(bytes.subarray(from, to)).catch(() => ''));
	}
	return found;
}

export async function countPdfPages(bytes: Uint8Array): Promise<number | null> {
	const text = latin1(bytes);
	if (!text.slice(0, 1024).includes('%PDF-')) return null;
	const texts = [text, ...(/\/ObjStm\b/.test(text) ? await objectStreams(text, bytes) : [])];
	const counts = texts.flatMap((part) => [...part.matchAll(PAGES_COUNT)].map((match) => Number(match[1] ?? match[2])));
	if (counts.length) return Math.max(...counts);
	return texts.reduce((sum, part) => sum + (part.match(PAGE)?.length ?? 0), 0);
}
