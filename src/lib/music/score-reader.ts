/**
 * Reads the text lines of a score's first pages in the browser with pdf.js, loaded only
 * when someone clicks "Aus den Noten lesen". The PDF comes through the app's proxy
 * (/api/noten), which only streams it: the Worker does no PDF work on the free plan's
 * small CPU budget. Scans without a text layer give no lines.
 */

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export class ScoreReadError extends Error {
	constructor(readonly reason: 'download' | 'unreadable') {
		super(reason);
		this.name = 'ScoreReadError';
	}
}

/**
 * Text items at about the same height are one line, read left to right. "About" is a third
 * of the text's size, so words of one line that sit a point apart stay together.
 */
export function groupLines(items: { str: string; transform: number[] }[]): string[] {
	const words = items
		.filter((item) => item.str?.trim())
		.map((item) => ({ str: item.str, x: item.transform[4], y: item.transform[5], size: Math.abs(item.transform[3]) || 10 }))
		.sort((a, b) => b.y - a.y);
	const lines: { y: number; size: number; words: typeof words }[] = [];
	for (const word of words) {
		const line = lines.at(-1);
		if (line && Math.abs(line.y - word.y) <= Math.max(line.size, word.size) / 3) line.words.push(word);
		else lines.push({ y: word.y, size: word.size, words: [word] });
	}
	return lines.map((line) =>
		line.words
			.sort((a, b) => a.x - b.x)
			.map((word) => word.str)
			.join(' ')
	);
}

export async function readScoreLines(fileId: string, pages = 2): Promise<string[]> {
	let data: ArrayBuffer;
	try {
		const response = await fetch(`/api/noten/${encodeURIComponent(fileId)}`);
		if (!response.ok) throw new Error(String(response.status));
		data = await response.arrayBuffer();
	} catch {
		throw new ScoreReadError('download');
	}
	try {
		const pdfjs = await import('pdfjs-dist');
		pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
		// Copy-protected publisher PDFs open with the empty password, like for merging (#80).
		const task = pdfjs.getDocument({ data, password: '' });
		const doc = await task.promise;
		const lines: string[] = [];
		for (let number = 1; number <= Math.min(pages, doc.numPages); number++) {
			const content = await (await doc.getPage(number)).getTextContent();
			lines.push(...groupLines(content.items as { str: string; transform: number[] }[]));
		}
		await task.destroy();
		return lines;
	} catch {
		throw new ScoreReadError('unreadable');
	}
}
