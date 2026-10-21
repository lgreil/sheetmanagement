import { config } from '#lib/config/index.ts';
import { t } from '#lib/i18n/index.ts';
import { appEnv } from '#lib/server/env.ts';
import type { RequestHandler } from './$types';

/**
 * The web app manifest (#62): lets members add the app to their home screen, where it opens
 * without the browser's bars. Built per deployment, for the orchestra's own name.
 */
export const GET: RequestHandler = () => {
	const env = appEnv();
	const name = env.ORCHESTRA_NAME?.trim() || config.name;
	const shortName = env.ORCHESTRA_SHORT_NAME?.trim() || env.ORCHESTRA_NAME?.trim() || config.shortName;
	const manifest = {
		name: `${name} · ${t.nav.appName}`,
		short_name: shortName,
		description: t.pwa.description,
		lang: 'de',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		background_color: '#f4f4f1',
		theme_color: config.accent,
		icons: [{ src: '/logo.png', sizes: '256x256', type: 'image/png', purpose: 'any' }],
		shortcuts: [
			{ name: t.nav.myParts, url: '/meine-noten' },
			{ name: t.nav.concerts, url: '/konzerte' }
		]
	};
	return new Response(JSON.stringify(manifest), {
		headers: { 'content-type': 'application/manifest+json', 'cache-control': 'public, max-age=3600' }
	});
};
