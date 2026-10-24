/**
 * A member's own pen marks in a part ("Notizen"), drawn in the practice viewer. Points are
 * relative to the page (0 to 1 across and down), so the marks sit right at any size.
 */

export const MARK_COLORS = ['graphite', 'red', 'blue'] as const;
export type MarkColor = (typeof MARK_COLORS)[number];

export interface Stroke {
	color: MarkColor;
	/** x, y, x, y … */
	points: number[];
}

/** Enough for a well-marked page; more is not a pencil. */
export const MAX_STROKES = 400;
export const MAX_POINTS = 2000;

const round = (value: number) => Math.round(value * 10_000) / 10_000;

/** Kept on the page: a line drawn past its edge ends at the edge. */
export const onPage = (value: number) => Math.min(1, Math.max(0, value));

/**
 * The strokes of one page as the viewer sent them, checked, on the page and rounded; null for
 * anything that isn't strokes. A stroke with too many points keeps an even selection of them.
 */
export function parseStrokes(value: unknown): Stroke[] | null {
	if (!Array.isArray(value) || value.length > MAX_STROKES) return null;
	const strokes: Stroke[] = [];
	for (const item of value) {
		const { color, points } = (item ?? {}) as { color?: unknown; points?: unknown };
		if (!MARK_COLORS.includes(color as MarkColor) || !Array.isArray(points)) return null;
		if (points.length < 2 || points.length % 2 || points.length > MAX_POINTS * 20) return null;
		if (!points.every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
		strokes.push({ color: color as MarkColor, points: fewer(points as number[]).map((n) => round(onPage(n))) });
	}
	return strokes;
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

/** An SVG path through the points, in a box `width` × `height`. */
export function strokePath(points: number[], width: number, height: number): string {
	const parts: string[] = [];
	for (let i = 0; i < points.length; i += 2) parts.push(`${i ? 'L' : 'M'}${(points[i] * width).toFixed(1)} ${(points[i + 1] * height).toFixed(1)}`);
	// A dot: a line of no length, which the round cap draws.
	return points.length === 2 ? `${parts[0]} l0.01 0` : parts.join(' ');
}
