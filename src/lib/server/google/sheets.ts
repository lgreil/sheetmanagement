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

/** Appends rows below the last row of a range (e.g. a tab). */
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
			params: { valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS' },
			body: { values: rows }
		}
	);
}
