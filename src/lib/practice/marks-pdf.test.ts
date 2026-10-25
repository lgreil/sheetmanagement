import { describe, expect, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { drawMarks, pdfPath, pdfPoint } from './marks-pdf.ts';

const A4 = { x: 0, y: 0, width: 595, height: 842 };

describe('pdfPoint', () => {
	it('puts the page’s top-left corner as shown at its place in the PDF', () => {
		// Not turned: top-left is (0, height) with y going up.
		expect(pdfPoint(0, 0, A4, 0)).toEqual([0, 842]);
		expect(pdfPoint(1, 1, A4, 0)).toEqual([595, 0]);
		expect(pdfPoint(0.5, 0.25, A4, 0)).toEqual([297.5, 631.5]);
	});

	it('follows the page’s rotation', () => {
		// Turned a quarter clockwise: the page's bottom-left is shown top-left.
		expect(pdfPoint(0, 0, A4, 90)).toEqual([0, 0]);
		expect(pdfPoint(1, 0, A4, 90)).toEqual([0, 842]);
		expect(pdfPoint(0, 1, A4, 90)).toEqual([595, 0]);
		// Upside down: the page's bottom-right is shown top-left.
		expect(pdfPoint(0, 0, A4, 180)).toEqual([595, 0]);
		// Three quarters: its top-right.
		expect(pdfPoint(0, 0, A4, 270)).toEqual([595, 842]);
		expect(pdfPoint(0, 0, A4, -90)).toEqual([595, 842]);
	});

	it('starts at the crop box, not the paper', () => {
		expect(pdfPoint(0, 0, { x: 20, y: 30, width: 500, height: 700 }, 0)).toEqual([20, 730]);
	});
});

describe('pdfPath', () => {
	it('is a path for drawSvgPath at (0, 0), y running down', () => {
		expect(pdfPath([0, 0, 1, 1], A4, 0)).toBe('M0.00 -842.00 L595.00 0.00');
		expect(pdfPath([0.5, 0.5], A4, 0)).toBe('M297.50 -421.00 l0.01 0');
	});
});

describe('drawMarks', () => {
	it('draws the strokes onto the page, and nothing without any', async () => {
		const doc = await PDFDocument.create();
		const page = doc.addPage([595, 842]);
		const empty = (await doc.save()).length;
		await drawMarks(page, undefined);
		await drawMarks(page, []);
		expect((await doc.save()).length).toBe(empty);
		await drawMarks(page, [{ color: 'red', points: [0.1, 0.1, 0.5, 0.2, 0.9, 0.1] }]);
		expect((await doc.save()).length).toBeGreaterThan(empty);
	});
});
