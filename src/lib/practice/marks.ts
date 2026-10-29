/**
 * A member's own pen marks in a part ("Notizen"), drawn in the practice viewer. Points are
 * relative to the page (0 to 1 across and down), so the marks sit right at any size.
 */

export const MARK_COLORS = ['graphite', 'red', 'blue'] as const;
export type MarkColor = (typeof MARK_COLORS)[number];

/**
 * The marks a player writes most, placed with one tap (#236): one point each, where a drawn
 * bowing is dozens. Drawn as lines (see `symbolLines`), so they look like the pencil's.
 */
export const MARK_SYMBOLS = ['downbow', 'upbow', 'breath', 'fermata', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'cresc', 'dim'] as const;
export type MarkSymbol = (typeof MARK_SYMBOLS)[number];

export interface Stroke {
	color: MarkColor;
	/** x, y, x, y …; a symbol's one point is its middle. */
	points: number[];
	symbol?: MarkSymbol;
}

/** Enough for a well-marked page; more is not a pencil. */
export const MAX_STROKES = 400;
export const MAX_POINTS = 2000;
/**
 * All the points on one page, drawn lines and symbols together: some hundred drawn marks, a few
 * dozen kilobytes a page in the database. Symbols take one point each, so they always fit.
 */
export const MAX_PAGE_POINTS = 4000;

/** The points a page's marks take, against MAX_PAGE_POINTS. */
export const pagePoints = (strokes: Stroke[]) => strokes.reduce((sum, stroke) => sum + stroke.points.length / 2, 0);

const round = (value: number) => Math.round(value * 10_000) / 10_000;

/** Kept on the page: a line drawn past its edge ends at the edge. */
export const onPage = (value: number) => Math.min(1, Math.max(0, value));

/**
 * The strokes of one page as the viewer sent them, checked, on the page and rounded; null for
 * anything that isn't strokes or a page over MAX_PAGE_POINTS. A stroke with too many points keeps
 * an even selection of them.
 */
export function parseStrokes(value: unknown): Stroke[] | null {
	if (!Array.isArray(value) || value.length > MAX_STROKES) return null;
	const strokes: Stroke[] = [];
	for (const item of value) {
		const { color, points, symbol } = (item ?? {}) as { color?: unknown; points?: unknown; symbol?: unknown };
		if (!MARK_COLORS.includes(color as MarkColor) || !Array.isArray(points)) return null;
		if (points.length < 2 || points.length % 2 || points.length > MAX_POINTS * 20) return null;
		if (!points.every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
		const stroke: Stroke = { color: color as MarkColor, points: fewer(points as number[]).map((n) => round(onPage(n))) };
		if (symbol !== undefined) {
			if (!MARK_SYMBOLS.includes(symbol as MarkSymbol) || points.length !== 2) return null;
			stroke.symbol = symbol as MarkSymbol;
		}
		strokes.push(stroke);
	}
	return pagePoints(strokes) > MAX_PAGE_POINTS ? null : strokes;
}

/** At most MAX_POINTS points, evenly picked, both ends kept. */
function fewer(points: number[]): number[] {
	const count = points.length / 2;
	if (count <= MAX_POINTS) return points;
	const kept: number[] = [];
	for (let i = 0; i < MAX_POINTS; i++) {
		const at = Math.round((i * (count - 1)) / (MAX_POINTS - 1));
		kept.push(points[at * 2], points[at * 2 + 1]);
	}
	return kept;
}

/**
 * Someone else's marks on a page, taken over into one's own: those not there already, in order,
 * as long as the page has room (MAX_PAGE_POINTS, MAX_STROKES). `skipped` didn't fit.
 */
export function mergeMarks(own: Stroke[], offered: Stroke[]): { strokes: Stroke[]; skipped: number } {
	const strokes = [...own];
	const there = new Set(own.map((stroke) => JSON.stringify(stroke)));
	let points = pagePoints(own);
	let skipped = 0;
	for (const stroke of offered) {
		const key = JSON.stringify(stroke);
		if (there.has(key)) continue;
		if (strokes.length >= MAX_STROKES || points + stroke.points.length / 2 > MAX_PAGE_POINTS) {
			skipped++;
			continue;
		}
		strokes.push(stroke);
		there.add(key);
		points += stroke.points.length / 2;
	}
	return { strokes, skipped };
}

/** Leaves out points closer than `min` to the last one kept, so a slow line isn't hundreds of them. */
export function thinPoints(points: number[], min = 0.002): number[] {
	if (points.length <= 4) return points;
	const kept = [points[0], points[1]];
	for (let i = 2; i < points.length - 2; i += 2) {
		const [x, y] = [points[i], points[i + 1]];
		if (Math.hypot(x - kept.at(-2)!, y - kept.at(-1)!) >= min) kept.push(x, y);
	}
	kept.push(points.at(-2)!, points.at(-1)!);
	return kept;
}

/** A symbol's size: its unit as a share of the page's width. */
export const SYMBOL_SIZE = 0.026;

/** An arc of an ellipse as a line, in symbol units. */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, steps = 10): number[] {
	return Array.from({ length: steps + 1 }, (_, i) => {
		const angle = from + ((to - from) * i) / steps;
		return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
	}).flat();
}

/** The dynamics' letters, written as by hand: lines in symbol units from the letter's left, and its width. */
const LETTERS: Record<'p' | 'm' | 'f', { width: number; lines: number[][] }> = {
	p: { width: 0.5, lines: [[0, -0.17, 0.13, -0.26, -0.03, 0.55], arc(0.25, 0, 0.17, 0.24, 0, 2 * Math.PI, 14)] },
	m: {
		width: 0.62,
		lines: [[0, -0.18, 0.07, -0.25, 0.03, 0.25, 0.08, -0.08, 0.17, -0.24, 0.24, -0.2, 0.22, 0.25, 0.27, -0.08, 0.36, -0.24, 0.43, -0.2, 0.4, 0.18, 0.46, 0.24, 0.52, 0.18]]
	},
	f: { width: 0.42, lines: [[0.46, -0.52, 0.38, -0.62, 0.26, -0.58, 0.18, -0.35, 0.06, 0.4, -0.02, 0.55, -0.12, 0.52], [0.04, -0.2, 0.36, -0.2]] }
};

/** A symbol's lines in symbol units, around its middle, y down. */
function glyph(symbol: MarkSymbol): number[][] {
	switch (symbol) {
		case 'downbow':
			return [[-0.35, 0.35, -0.35, -0.35, 0.35, -0.35, 0.35, 0.35], [-0.35, -0.27, 0.35, -0.27]];
		case 'upbow':
			return [[-0.3, -0.4, 0, 0.4, 0.3, -0.4]];
		case 'breath':
			return [[0.02, -0.35, 0.09, -0.26, 0.07, -0.1, -0.06, 0.08]];
		case 'fermata':
			return [arc(0, 0.25, 0.5, 0.5, Math.PI, 2 * Math.PI, 14), [0, 0.12]];
		case 'cresc':
			return [[0.9, -0.25, -0.9, 0, 0.9, 0.25]];
		case 'dim':
			return [[-0.9, -0.25, 0.9, 0, -0.9, 0.25]];
		default: {
			const letters = [...symbol].map((letter) => LETTERS[letter as 'p' | 'm' | 'f']);
			let left = -letters.reduce((sum, letter) => sum + letter.width, 0) / 2;
			const lines: number[][] = [];
			for (const letter of letters) {
				for (const line of letter.lines) lines.push(line.map((n, i) => (i % 2 ? n : n + left)));
				left += letter.width;
			}
			return lines;
		}
	}
}

/**
 * A symbol's lines on the page, page-relative like a stroke's points, around (x, y); `aspect` is
 * the page's width over its height as shown, so a symbol isn't stretched.
 */
export function symbolLines(symbol: MarkSymbol, x: number, y: number, aspect: number): number[][] {
	return glyph(symbol).map((line) => line.map((n, i) => (i % 2 ? y + n * SYMBOL_SIZE * aspect : x + n * SYMBOL_SIZE)));
}

/** The lines a mark is drawn with: a stroke its own, a symbol its glyph's. */
export function markLines(stroke: Stroke, aspect: number): number[][] {
	return stroke.symbol ? symbolLines(stroke.symbol, stroke.points[0], stroke.points[1], aspect) : [stroke.points];
}

/** An SVG path through the points, in a box `width` × `height`. */
export function strokePath(points: number[], width: number, height: number): string {
	const parts: string[] = [];
	for (let i = 0; i < points.length; i += 2) parts.push(`${i ? 'L' : 'M'}${(points[i] * width).toFixed(1)} ${(points[i + 1] * height).toFixed(1)}`);
	// A dot: a line of no length, which the round cap draws.
	return points.length === 2 ? `${parts[0]} l0.01 0` : parts.join(' ');
}
