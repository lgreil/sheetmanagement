import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';
import { self as sw } from '$app/service-worker';

/**
 * Offline mode for rehearsal halls with bad reception (#62). The app's own files come from
 * the cache; pages are fetched fresh and kept, so the last version of every page a member
 * opened still shows without a connection. Parts saved on "Meine Noten" are kept too.
 * Signing out deletes everything personal.
 */

const APP = `app-${version}`;
/** Pages as last seen, including SvelteKit's page data for navigating inside the app. */
const PAGES = 'pages-v1';
/** Part PDFs saved on "Meine Noten". */
const NOTEN = 'noten-v1';
const MAX_PAGES = 80;
/** Paths come relative to the base path; requests are matched by their absolute path. */
const ASSETS = new Set([...immutable, ...assets].map(({ path }) => `/${path.replace(/^\//, '')}`));

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(APP).then((cache) => cache.addAll([...ASSETS])));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) if (key.startsWith('app-') && key !== APP) await caches.delete(key);
			await sw.clients.claim();
		})()
	);
});

// A new version waits until the "Neu laden" button asks for it (#140): no tab changes under someone's hands.
sw.addEventListener('message', (event) => {
	if (event.data === 'skip-waiting') sw.skipWaiting();
});

/** Keeps the page cache small: the oldest entries go first. */
async function trim(cache: Cache) {
	const keys = await cache.keys();
	for (const key of keys.slice(0, Math.max(0, keys.length - MAX_PAGES))) await cache.delete(key);
}

const offlinePage = () =>
	new Response(
		`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;line-height:1.5">
<h1>Keine Verbindung</h1><p>Diese Seite war noch nicht auf diesem Gerät geöffnet, deshalb gibt es sie offline nicht.</p>
<p>Seiten, die du schon einmal geöffnet hast, und offline gespeicherte Noten gehen auch ohne Netz.</p>
<p><a href="/meine-noten">Zu „Meine Noten“</a> · <a href="/">Zur Übersicht</a></p></body></html>`,
		{ status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } }
	);

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	// Signing out: nothing personal stays on the device.
	if (request.method === 'POST' && url.pathname === '/auth/logout') {
		event.waitUntil(Promise.all([caches.delete(PAGES), caches.delete(NOTEN)]));
		return;
	}
	if (request.method !== 'GET') return;

	// The app's own files, fixed per version.
	if (ASSETS.has(url.pathname)) {
		event.respondWith(caches.match(url.pathname).then((cached) => cached ?? fetch(request)));
		return;
	}

	// A part's PDF: fresh when online, updating a saved copy; the saved copy offline.
	if (url.pathname.startsWith('/api/noten/')) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(NOTEN);
				try {
					const response = await fetch(request);
					if (response.ok && (await cache.match(url.pathname))) await cache.put(url.pathname, response.clone());
					return response;
				} catch {
					return (await cache.match(url.pathname)) ?? Response.error();
				}
			})()
		);
		return;
	}

	// Sign-in, feeds, other endpoints: always the network.
	const data = url.pathname.endsWith('/__data.json');
	if (!data && request.mode !== 'navigate') return;
	if (url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/demo')) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(PAGES);
			// Page data carries a changing "x-sveltekit-invalidated" parameter; the path is what counts.
			const key = data ? url.origin + url.pathname : request.url;
			try {
				const response = await fetch(request);
				if (response.ok && !response.redirected) {
					await cache.put(key, response.clone());
					event.waitUntil(trim(cache));
				}
				return response;
			} catch {
				const cached = (await cache.match(key)) ?? (data ? undefined : await cache.match(request, { ignoreSearch: true }));
				if (cached) return cached;
				return data ? Response.error() : offlinePage();
			}
		})()
	);
});
