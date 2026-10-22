<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '#lib/i18n/index.ts';
	import Segmented from './Segmented.svelte';

	/** System, light or dark as one segmented control; shown in the menu and on the profile. */
	type Theme = 'system' | 'light' | 'dark';
	const options = [
		{ value: 'system' as const, label: t.theme.system, icon: 'monitor' as const },
		{ value: 'light' as const, label: t.theme.light, icon: 'sun' as const },
		{ value: 'dark' as const, label: t.theme.dark, icon: 'moon' as const }
	];

	/** Fills its row, e.g. in the menu, instead of sizing to its labels. */
	let { wide = false }: { wide?: boolean } = $props();

	let theme = $state<Theme>('system');

	onMount(() => {
		const current = document.documentElement.dataset.theme;
		if (current === 'light' || current === 'dark') theme = current;
	});

	// Where the switch was tapped: the new colours spread from there.
	let origin = { x: innerWidth / 2, y: 0 };
	const remember = (event: PointerEvent) => (origin = { x: event.clientX, y: event.clientY });

	function set(next: Theme) {
		const root = document.documentElement;
		if (next === 'system') delete root.dataset.theme;
		else root.dataset.theme = next;
	}

	/**
	 * The new colour scheme grows as a circle from the switch (#129). Without View Transitions
	 * the colours fade; with reduced motion they simply change.
	 */
	function apply(next: Theme) {
		const root = document.documentElement;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) set(next);
		else if (document.startViewTransition) {
			root.classList.add('theme-switch');
			const transition = document.startViewTransition(() => set(next));
			transition.ready
				.then(() => {
					const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
					root.animate(
						{ clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
						{ duration: 450, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
					);
				})
				.catch(() => {});
			transition.finished.finally(() => root.classList.remove('theme-switch'));
		} else {
			root.classList.add('theme-fade');
			set(next);
			setTimeout(() => root.classList.remove('theme-fade'), 400);
		}
		try {
			if (next === 'system') localStorage.removeItem('theme');
			else localStorage.setItem('theme', next);
		} catch {
			// Storage can be blocked; the choice then lasts for this visit only.
		}
	}
</script>

<div class="theme" class:wide role="presentation" onpointerdown={remember}>
	<Segmented {options} bind:value={theme} label={t.theme.label} onchange={apply} />
</div>

<style>
	.theme {
		display: contents;
	}

	.theme.wide {
		display: grid;
		width: 100%;
	}

	.wide :global(.segmented) {
		display: grid;
	}
</style>
