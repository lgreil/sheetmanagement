<script lang="ts">
	import { updated } from '$app/state';
	import { t } from '#lib/i18n/index.ts';
	import Icon from './Icon.svelte';

	/**
	 * "Neue Version verfügbar · Neu laden" after a deploy (#140). SvelteKit notices a new
	 * version (it asks every few minutes, and on coming back to the tab); the service worker
	 * of the new version waits until someone clicks, so nothing reloads while someone types.
	 */
	let waiting = $state<ServiceWorker | null>(null);
	let reloading = $state(false);

	$effect(() => {
		if (!('serviceWorker' in navigator)) return;
		let registration: ServiceWorkerRegistration | undefined;
		const watch = (worker: ServiceWorker | null) => {
			worker?.addEventListener('statechange', () => {
				if (worker.state === 'installed' && navigator.serviceWorker.controller) waiting = worker;
			});
		};
		const onfound = () => watch(registration?.installing ?? null);
		navigator.serviceWorker.getRegistration().then((found) => {
			registration = found;
			if (!found) return;
			if (found.waiting && navigator.serviceWorker.controller) waiting = found.waiting;
			watch(found.installing);
			found.addEventListener('updatefound', onfound);
		});
		return () => registration?.removeEventListener('updatefound', onfound);
	});

	// A new version on the server means a new service worker too: look for it.
	$effect(() => {
		if (updated.current && 'serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then((found) => found?.update());
	});

	function reload() {
		reloading = true;
		// Only this tab reloads, once the new service worker has taken over; other tabs keep what's typed.
		if (waiting) {
			navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
			waiting.postMessage('skip-waiting');
			// If the worker doesn't answer, reload anyway: the page is fetched fresh from the network.
			setTimeout(() => location.reload(), 3000);
		} else location.reload();
	}
</script>

{#if updated.current || waiting}
	<div class="update no-print" role="status">
		<Icon name="sparkle" size={16} />
		<span>{t.pwa.newVersion}</span>
		<button type="button" onclick={reload} disabled={reloading}>{t.pwa.reload}</button>
	</div>
{/if}

<style>
	.update {
		position: fixed;
		left: 50%;
		bottom: var(--space-5);
		z-index: 55;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		max-width: calc(100vw - 2 * var(--space-4));
		padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
		border-radius: 999px;
		background: var(--text);
		color: var(--bg);
		box-shadow: var(--shadow-raised);
		font-size: 0.875rem;
		transform: translateX(-50%);
		animation: rise 0.3s var(--ease);
	}

	span {
		white-space: nowrap;
	}

	button {
		height: 32px;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: 999px;
		background: var(--brand);
		color: var(--brand-ink);
		font: inherit;
		font-weight: 650;
		white-space: nowrap;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.7;
		cursor: progress;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translate(-50%, 12px);
		}
	}

	/* Above the bottom navigation on phones. */
	@media (max-width: 720px) {
		.update {
			bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom) + var(--space-3));
		}
	}
</style>
