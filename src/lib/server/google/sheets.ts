import type { GoogleClient } from './client.ts';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface SpreadsheetInfo {
	title: string;
	tabs: string[];
}

export async function getSpreadsheetInfo(client: GoogleClient, spreadsheetId: string): Promise<SpreadsheetInfo> {
	const result = await client.request<{
		properties?: { title?: string };
		sheets?: { properties?: { title?: string } }[];
	}>(`${BASE}/${encodeURIComponent(spreadsheetId)}`, {
		params: { fields: 'properties.title,sheets.properties.title' }
	});
	return {
		title: result.properties?.title ?? '',
		tabs: (result.sheets ?? []).map((sheet) => sheet.properties?.title ?? '').filter(Boolean)
	};
}

export interface Tab {
	sheetId: number;
	title: string;
	/** Descriptions of the tab's protected ranges. */
	protections: string[];
}

/** The tabs with their numeric ids, which formatting requests need. */
export async function getTabs(client: GoogleClient, spreadsheetId: string): Promise<Tab[]> {
	const result = await client.request<{
		sheets?: {
			properties?: { sheetId?: number; title?: string };
			protectedRanges?: { description?: string }[];
		}[];
	}>(`${BASE}/${encodeURIComponent(spreadsheetId)}`, {
		params: { fields: 'sheets(properties(sheetId,title),protectedRanges(description))' }
	});
	return (result.sheets ?? []).map((sheet) => ({
		sheetId: sheet.properties?.sheetId ?? 0,
		title: sheet.properties?.title ?? '',
		protections: (sheet.protectedRanges ?? []).map((range) => range.description ?? '')
	}));
}

/** A1 range for a whole tab or part of it, with the tab name quoted: "'Stücke'!A1:Z1". */
export function tabRange(tab: string, cells?: string): string {
	return `'${tab.replace(/'/g, "''")}'${cells ? `!${cells}` : ''}`;
}

/** 0 → "A", 26 → "AA". */
export function columnLetter(index: number): string {
	let letters = '';
	for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
		letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
	}
	return letters;
}

/** Reads several ranges (e.g. whole tabs: "Stücke") in one request. */
export async function getValues(
	client: GoogleClient,
	spreadsheetId: string,
	ranges: string[]
): Promise<Record<string, string[][]>> {
	const url = new URL(`${BASE}/${encodeURIComponent(spreadsheetId)}/values:batchGet`);
	for (const range of ranges) url.searchParams.append('ranges', range);
	const result = await client.request<{ valueRanges?: { values?: string[][] }[] }>(url.toString(), {
		params: { valueRenderOption: 'FORMATTED_VALUE', majorDimension: 'ROWS' }
	});
	return Object.fromEntries(ranges.map((range, i) => [range, result.valueRanges?.[i]?.values ?? []]));
}

/**
 * Appends rows below the last row of a range (e.g. a tab). Values are stored as
 * typed (RAW), so a folder name like "=…" never turns into a formula.
 */
export async function appendRows(
	client: GoogleClient,
	spreadsheetId: string,
	range: string,
	rows: (string | number)[][]
): Promise<void> {
	await client.request(
		`${BASE}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append`,
		{
			method: 'POST',
			params: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' },
			body: { values: rows }
		}
	);
}

/** Writes values into several ranges at once. */
export async function updateValues(
	client: GoogleClient,
	spreadsheetId: string,
	data: { range: string; values: (string | number | boolean)[][] }[]
): Promise<void> {
	await client.request(`${BASE}/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`, {
		method: 'POST',
		body: { valueInputOption: 'RAW', data }
	});
}

/** Structural and formatting changes (spreadsheets.batchUpdate). Returns one reply per request. */
export async function batchUpdate(
	client: GoogleClient,
	spreadsheetId: string,
	requests: object[]
): Promise<Record<string, unknown>[]> {
	if (requests.length === 0) return [];
	const result = await client.request<{ replies?: Record<string, unknown>[] }>(
		`${BASE}/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
		{ method: 'POST', body: { requests } }
	);
	return result.replies ?? [];
}
