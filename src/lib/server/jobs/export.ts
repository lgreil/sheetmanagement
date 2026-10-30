import { t } from '#lib/i18n/index.ts';
import { usingD1 } from '../data-source.ts';
import { exportToSheet } from '../data-transfer.ts';
import type { JobResult } from './index.ts';

/** Once a night (#186): D1 into the sheet, as a copy to read and print and a backup outside Cloudflare. */
export async function exportData(): Promise<JobResult> {
	if (!(await usingD1())) return { ok: true, summary: t.dataMove.exportSheetOff };
	const { tabs, rows } = await exportToSheet();
	return { ok: true, summary: t.dataMove.exported(rows, tabs) };
}
