<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { t } from '#lib/i18n/index.ts';
	import { placeCard, shouldOffer, TOUR_STORAGE_KEY, tourSteps, type Box, type TourOutcome } from '#lib/tour/tour.ts';
	import { tour } from '#lib/tour/state.svelte.ts';
	import Icon from './Icon.svelte';

	/**
	 * The tour for new members: offered once, then step by step through the main pages and the
	 * profile. Not modal: the page stays usable, so the instrument or the colour scheme can be
	 * set right where the card points. Escape or "Tour beenden" skip it at any step.
	 */
	let {
		status,
		account,
		name
	}: {
		/** From the layout: offer it, seen already, or ask this browser. */
		status: 'offer' | 'seen' | 'local';
		/** Signed in: the profile's steps, and how it ended is kept in D1. */
		account: boolean;
		name: string;
	} = $props();

	const steps = $derived(tourSteps({ account }));
	/** Optional steps whose target isn't on their page, e.g. notifications that aren't set up. */
	let missing = $state(new Set<string>());
	const shown = $derived(steps.filter((step) => !missing.has(step.key)));

	let index = $state<number | null>(null);
	let ready = $state(false);
	let ended = $state(false);
	let stored = $state<string | null>(null);
	let mounted = $state(false);
	$effect(() => {
		try {
			stored = localStorage.getItem(TOUR_STORAGE_KEY);
		} catch {
			// Storage can be blocked; then it's offered on each visit until finished on the server.
		}
		mounted = true;
	});

	// Offered on the start page only: elsewhere the card would sit over what the member came for (#219).
	const offering = $derived(mounted && !ended && index === null && page.url.pathname === '/' && shouldOffer(status, stored));
	const step = $derived(index === null ? null : steps[index]);
	const position = $derived(step ? shown.indexOf(step) : -1);
	const last = $derived(step ? position === shown.length - 1 : false);

	// "Tour noch einmal machen" on the profile.
	$effect(() => {
		if (tour.requested) untrack(() => go(0, 1));
	});

	let card = $state<HTMLElement>();
	let heading = $state<HTMLElement>();
	let target: HTMLElement | null = null;
	let ring = $state<Box | null>(null);
	let spot = $state({ left: 0, top: 0 });
	/** Hidden until measured, so it doesn't flash in the corner. */
	let placed = $state(false);
	let run = 0;

	/** The first visible match: the header's link on wide screens, the tab bar's on phones. */
	function find(selector: string | undefined): HTMLElement | null {
		if (!selector) return null;
		return [...document.querySelectorAll<HTMLElement>(selector)].find((element) => element.getClientRects().length > 0) ?? null;
	}

	/** Waits a moment for the page to show the target; the new page may still be rendering. */
	async function appear(selector: string | undefined, mine: number) {
		for (let tries = 0; tries < 30 && mine === run; tries++) {
			const found = find(selector);
			if (found || !selector) return found;
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		return null;
	}

	async function go(next: number, direction: 1 | -1) {
		const mine = ++run;
		const wanted = steps[next];
		if (!wanted) return next < 0 ? undefined : end('done');
		if (missing.has(wanted.key)) return go(next + direction, direction);
		ready = false;
		placed = false;
		index = next;
		// The focus goes to the card below, not to the top of the new page; the page starts at its top.
		if (page.url.pathname !== wanted.path) {
			await goto(wanted.path, { reset: false });
			scrollTo({ top: 0 });
		}
		if (mine !== run) return;
		const found = await appear(wanted.target, mine);
		if (mine !== run) return;
		// What the page doesn't have, the tour leaves out, also on the way back.
		const absent = steps.filter((other) => other.optional && other.path === wanted.path && !find(other.target)).map((other) => other.key);
		if (absent.length) missing = new Set([...missing, ...absent]);
		if (wanted.optional && !found) return go(next + direction, direction);
		target = found;
		reveal(found);
		ready = true;
		// Once it's placed: a hidden card can't take focus.
		await tick();
		await new Promise(requestAnimationFrame);
		await tick();
		if (mine === run) heading?.focus({ preventScroll: true });
	}

	/**
	 * Scrolls the target into the free space between header and tab bar, unless it's already
	 * there. Only the page's content scrolls: the header and the tab bar are always in view.
	 */
	function reveal(element: HTMLElement | null) {
		if (!element?.closest('main')) return;
		const box = element.getBoundingClientRect();
		const view = freeSpace();
		if (box.top >= view.top && box.bottom <= view.bottom) return;
		const room = view.bottom - view.top;
		// Something tall from its top, anything else in the middle.
		const top = scrollY + box.top - view.top - (box.height > room * 0.6 ? 12 : (room - box.height) / 2);
		scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
	}

	function freeSpace() {
		const header = document.querySelector('.topbar')?.getBoundingClientRect();
		const bar = document.querySelector('.tabbar');
		const tabbar = bar && bar.getClientRects().length ? bar.getBoundingClientRect() : null;
		return { width: document.documentElement.clientWidth, top: header?.bottom ?? 0, bottom: tabbar?.top ?? innerHeight };
	}

	/** Follows the target while the page scrolls, resizes or changes. */
	$effect(() => {
		if (!offering && !(step && ready)) return;
		let frame = requestAnimationFrame(function follow() {
			measure();
			frame = requestAnimationFrame(follow);
		});
		return () => cancelAnimationFrame(frame);
	});

	function measure() {
		if (!card) return;
		if (step && target && !target.isConnected) target = find(step.target);
		const box = step && target ? target.getBoundingClientRect() : null;
		const next = box ? { left: box.left - 4, top: box.top - 4, width: box.width + 8, height: box.height + 8 } : null;
		if (JSON.stringify(next) !== JSON.stringify(ring)) ring = next;
		const { left, top } = placeCard(next, { width: card.offsetWidth, height: card.offsetHeight }, freeSpace());
		if (left !== spot.left || top !== spot.top) spot = { left, top };
		placed = true;
	}

	function end(outcome: TourOutcome) {
		run++;
		const wasRunning = index !== null;
		index = null;
		target = null;
		ring = null;
		ended = true;
		record(outcome);
		if (wasRunning) document.getElementById('inhalt')?.focus({ preventScroll: true });
	}

	/** Kept with the member's other settings (D1, via the profile); in this browser for everyone else. */
	function record(outcome: TourOutcome) {
		if (account) {
			const body = new FormData();
			body.set('outcome', outcome);
			fetch('/profil?/tour', { method: 'POST', body, headers: { accept: 'application/json', 'x-sveltekit-action': 'true' } }).catch(() => {});
		}
		if (!account || status === 'local') {
			try {
				localStorage.setItem(TOUR_STORAGE_KEY, outcome);
				stored = outcome;
			} catch {
				// Then it's offered again next time.
			}
		}
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			end('skipped');
		}
	}

	const first = $derived(name.trim().split(/\s+/)[0] ?? '');
</script>

{#if ring}
	<div class="ring no-print" aria-hidden="true" style:left="{ring.left}px" style:top="{ring.top}px" style:width="{ring.width}px" style:height="{ring.height}px"></div>
{/if}

{#if offering || (step && ready)}
	<div
		class="card no-print"
		role="dialog"
		aria-modal="false"
		aria-labelledby="tour-title"
		aria-describedby="tour-text"
		tabindex="-1"
		bind:this={card}
		style:left="{spot.left}px"
		style:top="{spot.top}px"
		style:visibility={placed ? undefined : 'hidden'}
		{onkeydown}
		transition:fly={{ y: 8, duration: 180 }}
	>
		{#if step}
			<p class="count">{t.tour.step(position + 1, shown.length)}</p>
			<h2 id="tour-title" tabindex="-1" bind:this={heading}>{t.tour.steps[step.key].title}</h2>
			<p id="tour-text">{t.tour.steps[step.key].body}</p>
			<div class="dots" aria-hidden="true">
				{#each shown as each, at (each.key)}<span class:on={at === position}></span>{/each}
			</div>
			<div class="actions">
				{#if !last}<button class="link" onclick={() => end('skipped')}>{t.tour.end}</button>{/if}
				<span class="spacer"></span>
				{#if position > 0}<button class="btn ghost small" onclick={() => go(index! - 1, -1)}>{t.tour.back}</button>{/if}
				{#if last}
					<button class="btn small" onclick={() => end('done')}><Icon name="check" size={14} />{t.tour.finish}</button>
				{:else}
					<button class="btn small" onclick={() => go(index! + 1, 1)}>{t.tour.next}<Icon name="chevron" size={14} /></button>
				{/if}
			</div>
		{:else}
			<p class="count"><Icon name="sparkle" size={14} />{t.tour.label}</p>
			<h2 id="tour-title">{t.tour.welcome(first)}</h2>
			<p id="tour-text">{t.tour.offer}</p>
			<div class="actions">
				<button class="link" onclick={() => end('skipped')}>{t.tour.skip}</button>
				<span class="spacer"></span>
				<button class="btn small" onclick={() => go(0, 1)}>{t.tour.start}<Icon name="chevron" size={14} /></button>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* Around what the card talks about; clicks go through to it. */
	.ring {
		position: fixed;
		z-index: 15;
		border-radius: 14px;
		box-shadow:
			0 0 0 3px var(--accent),
			0 0 0 9px var(--accent-soft);
		pointer-events: none;
		transition:
			left 0.25s var(--ease),
			top 0.25s var(--ease),
			width 0.25s var(--ease),
			height 0.25s var(--ease);
	}

	.card {
		position: fixed;
		z-index: 16;
		display: grid;
		gap: var(--space-2);
		width: min(360px, calc(100vw - 2 * var(--space-4)));
		padding: var(--space-4) var(--space-5);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-l);
		background: var(--surface);
		box-shadow: var(--shadow-raised);
	}

	@media (prefers-reduced-motion: reduce) {
		.ring {
			transition: none;
		}
	}

	.count {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin: 0;
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 650;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-size: 1.125rem;
	}

	.card:focus,
	h2:focus {
		outline: none;
	}

	p {
		margin: 0;
	}

	#tour-text {
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.dots {
		display: flex;
		gap: 6px;
		margin-top: var(--space-1);
	}

	.dots span {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: var(--border);
		transition:
			width var(--fast) var(--ease),
			background var(--fast) var(--ease);
	}

	.dots span.on {
		width: 18px;
		background: var(--accent);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}

	.spacer {
		flex: 1;
	}

	.link {
		padding: var(--space-1) 0;
		border: 0;
		background: none;
		color: var(--text-muted);
		font: inherit;
		font-size: 0.875rem;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.link:hover {
		color: var(--text);
	}
</style>
