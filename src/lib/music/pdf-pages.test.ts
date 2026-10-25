import { PDFDocument } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { samplePdf } from '#lib/server/demo/pdf.ts';
import { countPdfPages } from './pdf-pages.ts';

async function pdf(pages: number, useObjectStreams: boolean) {
	const document = await PDFDocument.create();
	for (let i = 0; i < pages; i++) document.addPage();
	return document.save({ useObjectStreams });
}

describe('countPdfPages', () => {
	it.each([1, 3, 12])('counts %i pages, with and without object streams', async (pages) => {
		expect(await countPdfPages(await pdf(pages, false))).toBe(pages);
		expect(await countPdfPages(await pdf(pages, true))).toBe(pages);
	});

	it('reads a PDF written by hand', async () => {
		expect(await countPdfPages(samplePdf({ title: 'Egmont', part: 'Violine I' }))).toBe(1);
		expect(await countPdfPages(samplePdf({ title: 'Sleigh Ride', part: 'Flöte', pages: 3 }))).toBe(3);
	});

	it('finds no pages in a PDF without any', async () => {
		expect(await countPdfPages(new TextEncoder().encode('%PDF-1.4\n%%EOF'))).toBe(0);
	});

	it('knows when a file is no PDF at all', async () => {
		expect(await countPdfPages(new Uint8Array())).toBeNull();
		expect(await countPdfPages(new TextEncoder().encode('<html>Fehler</html>'))).toBeNull();
	});
});
