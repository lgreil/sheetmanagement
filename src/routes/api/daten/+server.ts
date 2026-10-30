import { requireAdminWhenSignInIsOn } from '#lib/server/auth/index.ts';
import { allData } from '#lib/server/data-transfer.ts';
import { today } from '#lib/server/members.ts';
import type { RequestHandler } from './$types';

/** "Alles herunterladen" (#186): every tab by column key as JSON, from wherever the data lives. */
export const GET: RequestHandler = async ({ locals }) => {
	requireAdminWhenSignInIsOn(locals);
	const data = await allData();
	return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, '\t'), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'content-disposition': `attachment; filename="daten-${today()}.json"`,
			'cache-control': 'no-store'
		}
	});
};
