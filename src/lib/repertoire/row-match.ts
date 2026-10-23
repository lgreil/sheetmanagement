import type { Table, TableRow } from './sheet.ts';

/**
 * Where the rows of an earlier read are now (#156). A row is found by its content, not
 * its number: someone may have deleted or inserted rows by hand, or another save may have
 * removed one, since the caller read the tab. Same number and same content wins; else the
 * nearest row with the same content. Undefined when a row's content is gone or changed,
 * so the caller must not guess.
 */
export function matchRows<K extends string>(before: Table<K>, now: Table<K>, rows: number[]): Map<number, number> | undefined {
	const taken = new Set<number>();
	const found = new Map<number, number>();
	for (const row of [...new Set(rows)].sort((a, b) => a - b)) {
		const old = before.rows.find((r) => r.row === row);
		if (!old) return undefined;
		const candidates = now.rows.filter((r) => !taken.has(r.row) && sameValues(r, old));
		if (!candidates.length) return undefined;
		const match = candidates.reduce((best, r) => (Math.abs(r.row - row) < Math.abs(best.row - row) ? r : best));
		taken.add(match.row);
		found.set(row, match.row);
	}
	return found;
}

function sameValues<K extends string>(a: TableRow<K>, b: TableRow<K>): boolean {
	return (Object.keys(b.values) as K[]).every((key) => a.values[key] === b.values[key]);
}
