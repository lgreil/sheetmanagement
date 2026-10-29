import type { PDFPage } from '@cantoo/pdf-lib';
import { markLines, type MarkColor, type Stroke } from './marks.ts';

/**
 * The member's notes drawn into the merged PDF of a concert's parts ("Meine Noten"), where the
 * viewer showed them: marks are relative to the page as pdf.js shows it (its crop box, turned
 * by its rotation), so they're mapped back into the page's own coordinates.
 */

export interface PageBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** A point of a mark (0 to 1 across and down the page as shown) in PDF coordinates, y up. */
export function pdfPoint(across: number, down: number, box: PageBox, rotation: number): [number, number] {
	const { x, y, width, height } = box;
	switch (((rotation % 360) + 360) % 360) {
		case 90:
			return [x + down * width, y + across * height];
		case 180:
			return [x + (1 - across) * width, y + down * height];
		case 270:
			return [x + (1 - down) * width, y + (1 - across) * height];
		default:
			return [x + across * width, y + (1 - down) * height];
	}
}

/** A stroke as an SVG path for pdf-lib's drawSvgPath at (0, 0), whose y runs down: hence -y. */
export function pdfPath(points: number[], box: PageBox, rotation: number): string {
	const parts: string[] = [];
	for (let i = 0; i < points.length; i += 2) {
		const [x, y] = pdfPoint(points[i], points[i + 1], box, rotation);
		parts.push(`${i ? 'L' : 'M'}${x.toFixed(2)} ${(-y).toFixed(2)}`);
	}
	// A dot: a line of no length, which the round cap draws.
	return points.length === 2 ? `${parts[0]} l0.01 0` : parts.join(' ');
}

/** The viewer's colours (PracticeScore.svelte), 0 to 1. */
const COLORS: Record<MarkColor, [number, number, number]> = {
	graphite: [0x4a / 255, 0x4a / 255, 0x4a / 255],
	red: [0xd0 / 255, 0x34 / 255, 0x2c / 255],
	blue: [0x1f / 255, 0x5f / 255, 0xd1 / 255]
};

/** Draws one page's marks onto a page of the merged PDF. */
export async function drawMarks(page: PDFPage, strokes: Stroke[] | undefined) {
	if (!strokes?.length) return;
	const { rgb, LineCapStyle } = await import('@cantoo/pdf-lib');
	const box = page.getCropBox();
	const rotation = page.getRotation().angle;
	// As thick as in the viewer, where it's 0.32 % of the page's width as shown.
	const shownWidth = rotation % 180 ? box.height : box.width;
	const width = Math.max(0.8, shownWidth * 0.0032);
	const shownHeight = rotation % 180 ? box.width : box.height;
	for (const stroke of strokes) {
		for (const line of markLines(stroke, shownWidth / shownHeight)) {
			page.drawSvgPath(pdfPath(line, box, rotation), {
				x: 0,
				y: 0,
				borderColor: rgb(...COLORS[stroke.color]),
				borderWidth: width,
				borderLineCap: LineCapStyle.Round
			});
		}
	}
}
