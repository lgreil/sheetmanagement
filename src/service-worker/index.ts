import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';
import { self as sw } from '$app/service-worker';

/**
 * Offline mode for rehearsal halls with bad reception (#62). The app's own files come from
 * the cache; pages are fetched fresh and kept, so the last version of every page a member
 * opened still shows without a connection. Parts saved on "Meine Noten" are kept too.
 * Signing out deletes everything personal. It also shows reminders (#157).
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

/**
 * The page for a page never opened on this device, in the app's language (#124). Its own few
 * words, so the worker doesn't load every text of the app.
 */
const OFFLINE = {
	de: {
		title: 'Keine Verbindung',
		text: 'Diese Seite war noch nicht auf diesem Gerät geöffnet, deshalb gibt es sie offline nicht.',
		hint: 'Seiten, die du schon einmal geöffnet hast, und offline gespeicherte Noten gehen auch ohne Netz.',
		myParts: 'Zu „Meine Noten“',
		home: 'Zur Übersicht'
	},
	en: {
		title: 'No connection',
		text: "This page hasn't been opened on this device yet, so it isn't available offline.",
		hint: 'Pages you have opened before and parts saved for offline use work without a connection too.',
		myParts: 'To “My parts”',
		home: 'To the overview'
	}
}[__LANGUAGE__];

const offlinePage = () =>
	new Response(
		`<!doctype html><html lang="${__LANGUAGE__}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;line-height:1.5">
<h1>${OFFLINE.title}</h1><p>${OFFLINE.text}</p>
<p>${OFFLINE.hint}</p>
<p><a href="/meine-noten">${OFFLINE.myParts}</a> · <a href="/">${OFFLINE.home}</a></p></body></html>`,
		{ status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } }
	);

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	// Signing out: nothing personal stays on the device, and it gets no more reminders. The
	// device is taken off first, while the member is still signed in.
	if (request.method === 'POST' && url.pathname === '/auth/logout') {
		event.waitUntil(Promise.all([caches.delete(PAGES), caches.delete(NOTEN)]));
		event.respondWith(
			(async () => {
				const subscription = await sw.registration.pushManager?.getSubscription().catch(() => null);
				if (subscription) {
					await fetch('/api/push', {
						method: 'DELETE',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ endpoint: subscription.endpoint })
					}).catch(() => undefined);
					await subscription.unsubscribe().catch(() => undefined);
				}
				return fetch(request);
			})()
		);
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

/** A reminder from the app (#157): title, text, the page to open, and a tag that replaces an older one. */
sw.addEventListener('push', (event) => {
	const notice = (() => {
		try {
			return (event.data?.json() ?? {}) as { title?: string; body?: string; url?: string; tag?: string; icon?: string };
		} catch {
			return { body: event.data?.text() };
		}
	})();
	event.waitUntil(
		sw.registration.showNotification(notice.title ?? '', { body: notice.body, tag: notice.tag, icon: notice.icon, data: { url: notice.url ?? '/' } })
	);
});

/** A tap opens the page, in an open window of the app if there is one. */
sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = new URL((event.notification.data as { url?: string } | null)?.url ?? '/', sw.location.origin);
	if (url.origin !== sw.location.origin) return;
	event.waitUntil(
		(async () => {
			const windows = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
			const open = windows.find((client) => new URL(client.url).origin === url.origin);
			if (!open) return void (await sw.clients.openWindow(url.href));
			await open.focus();
			await open.navigate(url.href).catch(() => undefined);
		})()
	);
});
