import { redirect } from '@sveltejs/kit';
import { exportFileName, myData } from '#lib/access/my-data.ts';
import { t } from '#lib/i18n/index.ts';
import { orchestra } from '#lib/server/env.ts';
import { getAccessList, getAttendance, getFeedback, getPieceNotes, getRehearsalNotes, getSignups } from '#lib/server/repertoire.ts';
import type { RequestHandler } from './$types';

/** "Meine Daten herunterladen" (#158): the member's own rows from the sheet, as a JSON file. */
export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.access.user;
	if (locals.auth === 'off' || !user) redirect(303, '/anmelden');
	const [access, feedback, signups, attendance, pieceNotes, rehearsalNotes] = await Promise.all([
		getAccessList({ force: true }),
		getFeedback(),
		getSignups(),
		getAttendance(),
		getPieceNotes(),
		getRehearsalNotes()
	]);
	const member = access?.membersByEmail.get(user.email.trim().toLowerCase());
	const data = myData(
		{ email: user.email, name: member?.name || user.name },
		{
			...access?.tables,
			...feedback?.tables,
			signups: signups?.table,
			attendance: attendance?.table,
			pieceNotes: pieceNotes.table,
			rehearsalNotes: rehearsalNotes.table
		}
	);
	const body = {
		orchestra: orchestra().name,
		email: user.email,
		exportedAt: new Date().toISOString(),
		about: t.myData.explain,
		data
	};
	return new Response(JSON.stringify(body, null, 2), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'content-disposition': `attachment; filename="${exportFileName(user.email)}"`,
			'cache-control': 'private, no-store'
		}
	});
};
