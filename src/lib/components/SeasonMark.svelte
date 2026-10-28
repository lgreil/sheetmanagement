<script lang="ts" module>
	import type { Season } from '#lib/seasons.ts';

	/** How a season's small motifs move in the scene, and how its companion does. */
	type Motifs = 'fall' | 'twinkle' | 'burst' | 'spin' | 'sit';
	type Companion = 'fly' | 'flutter' | 'sway' | 'wave' | 'bob' | 'flicker' | 'fizz';

	/**
	 * Drawn on a 24 grid with round strokes in the text colour, like pencil marks in the margin.
	 * Each season has its motif and a companion with moving parts: wings, an arm, a flame.
	 */
	const SEASONS: Record<Season, { motif: string; companion: string; motifs: Motifs; moves: Companion }> = {
		advent: {
			motif: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>',
			// A candle with its flame.
			companion:
				'<path d="M9.5 11.5h5V21h-5z"/><path d="M12 11.5V9.8M7.5 21h9"/><g class="part flame"><path d="M12 3.6c1.5 1.7 1.9 3 1.9 3.9a1.9 1.9 0 0 1-3.8 0c0-.9.4-2.2 1.9-3.9z"/></g>',
			motifs: 'twinkle',
			moves: 'flicker'
		},
		newYear: {
			motif: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="1.2"/>',
			// A glass of sparkling wine, bubbles rising.
			companion:
				'<path d="M8.5 3h7l-.8 6.2a2.7 2.7 0 0 1-5.4 0z"/><path d="M12 12v7.5M9 20.5h6"/><circle class="part bubble" cx="11" cy="7.4" r=".6"/><circle class="part bubble late" cx="13" cy="6.6" r=".5"/>',
			motifs: 'burst',
			moves: 'fizz'
		},
		winter: {
			motif:
				'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.8 4.6L12 6.4l2.2-1.8M9.8 19.4L12 17.6l2.2 1.8M4.6 10.2l2.6-.5-.9-2.6M19.4 13.8l-2.6.5.9 2.6M6.3 16.4l.9-2.6-2.6-.5M17.7 7.6l-.9 2.6 2.6.5"/>',
			// A snowman in a top hat, waving.
			companion:
				'<circle cx="12" cy="8" r="3"/><circle cx="12" cy="16.2" r="4.8"/><path d="M9 5.2h6M10.2 5.2V2.6h3.6v2.6M12 8.4l2 .5M7.6 14.2l-3.2-2-.6-1.3"/><g class="part arm"><path d="M16.4 14.2l3.2-2 .6-1.3"/></g><circle cx="12" cy="14.6" r=".5" fill="currentColor"/><circle cx="12" cy="17.4" r=".5" fill="currentColor"/>',
			motifs: 'fall',
			moves: 'wave'
		},
		spring: {
			motif:
				'<circle cx="12" cy="7" r="3"/><circle cx="16.8" cy="10.5" r="3"/><circle cx="15" cy="16" r="3"/><circle cx="9" cy="16" r="3"/><circle cx="7.2" cy="10.5" r="3"/><circle cx="12" cy="12" r="1.3"/>',
			// A butterfly.
			companion:
				'<g class="part wing left"><path d="M11.6 11.5C9.5 6.8 5 5.8 4.2 8.6c-.7 2.6 2.6 4.1 7.4 3.4z"/><path d="M11.6 12.6c-3.6.6-6 2.4-5 4.4 1 1.9 4 .4 5-4.4z"/></g><g class="part wing right"><path d="M12.4 11.5C14.5 6.8 19 5.8 19.8 8.6c.7 2.6-2.6 4.1-7.4 3.4z"/><path d="M12.4 12.6c3.6.6 6 2.4 5 4.4-1 1.9-4 .4-5-4.4z"/></g><path d="M12 9.5v8M12 9.5l-1.6-2.6M12 9.5l1.6-2.6"/>',
			motifs: 'fall',
			moves: 'flutter'
		},
		summer: {
			motif: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
			// A sailing boat on the waves.
			companion:
				'<g class="part boat"><path d="M4.5 15.5h15l-2.6 3.6H7.1z"/><path d="M12 4v11.5M12.6 5.2l5.6 8.8h-5.6zM11.4 7.4L7 14h4.4z"/></g><path d="M2.5 21.5c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/>',
			motifs: 'spin',
			moves: 'bob'
		},
		autumn: {
			motif: '<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z"/><path d="M5 19L14 10M9.5 14.5h3.5M12 12V9"/>',
			// A kite in the wind, as children fly them in autumn.
			companion:
				'<g class="part kite"><path d="M14 2.5l5 5.5-5 8.5-5-8.5z"/><path d="M9 8h10M14 2.5v14"/><path class="tail" d="M14 16.5c-1.8 1.2.2 2.4-1.6 3.6s.2 2.4-1.6 3.4"/></g>',
			motifs: 'fall',
			moves: 'sway'
		},
		halloween: {
			motif:
				'<path d="M12 8c-4.5 0-7.5 2.6-7.5 6s3 6 7.5 6 7.5-2.6 7.5-6-3-6-7.5-6z"/><path d="M12 8c-2 0-3 2.7-3 6s1 6 3 6 3-2.7 3-6-1-6-3-6z"/><path d="M12 8V5.5c0-.8.6-1.5 1.5-1.5"/>',
			// A bat, flapping.
			companion:
				'<g class="part wing left"><path d="M10.4 11.6C8.6 9.6 5.6 9.2 3 10.6c1.3.5 1.8 1.5 1.6 2.7 1.2-.8 2.4-.6 3 .4.7-.8 1.8-.8 2.8-.2"/></g><g class="part wing right"><path d="M13.6 11.6c1.8-2 4.8-2.4 7.4-1-1.3.5-1.8 1.5-1.6 2.7-1.2-.8-2.4-.6-3 .4-.7-.8-1.8-.8-2.8-.2"/></g><path d="M12 9.4c1 0 1.8 1.2 1.8 2.8S13 15.4 12 15.4s-1.8-1.6-1.8-3.2.8-2.8 1.8-2.8zM11 9.8l-.4-1.6 1 1M13 9.8l.4-1.6-1 1"/>',
			motifs: 'sit',
			moves: 'fly'
		}
	};

	/** Where the scene's motifs sit or start: across the card's right part, behind the greeting. */
	const SPOTS = [
		{ x: 42, y: 18, size: 14, delay: 0, duration: 11 },
		{ x: 63, y: 62, size: 20, delay: -3.5, duration: 13 },
		{ x: 78, y: 12, size: 12, delay: -7, duration: 10 },
		{ x: 88, y: 48, size: 17, delay: -1.8, duration: 14 },
		{ x: 54, y: 34, size: 11, delay: -9, duration: 12 },
		{ x: 70, y: 28, size: 15, delay: -5.2, duration: 15 }
	];
	const COUNT: Record<Motifs, number> = { fall: 6, twinkle: 5, burst: 4, spin: 1, sit: 2 };
	/** Pumpkins and the sun sit in fixed places instead. */
	const PLACED: Partial<Record<Motifs, { x: number; y: number; size: number }[]>> = {
		sit: [
			{ x: 72, y: 50, size: 26 },
			{ x: 85, y: 62, size: 17 }
		],
		spin: [{ x: 66, y: 14, size: 30 }]
	};
</script>

<script lang="ts">
	import { page } from '$app/state';

	/**
	 * The season's drawings (#202): "scene" fills the start page's story card with the motifs
	 * and the companion moving; "pair" is motif and companion side by side; "companion" the
	 * companion alone. Nothing at all while the feature is off (page.data.season is null).
	 */
	let {
		variant = 'pair',
		size = 20,
		season = page.data.season as Season | null | undefined
	}: { variant?: 'scene' | 'pair' | 'companion'; size?: number; season?: Season | null } = $props();

	const look = $derived(season ? SEASONS[season] : null);
	const spots = $derived(look ? (PLACED[look.motifs] ?? SPOTS.slice(0, COUNT[look.motifs])) : []);
</script>

{#snippet drawing(markup: string, px: number, className = '')}
	<svg
		class={className}
		width={px}
		height={px}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.6"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<!-- The drawings above, never anything typed in. -->
		{@html markup}
	</svg>
{/snippet}

{#if look && season}
	{#if variant === 'scene'}
		<span class="scene {look.motifs} moves-{look.moves}" data-season={season} aria-hidden="true">
			{#each spots as spot, i (i)}
				<span
					class="motif"
					style:left="{spot.x}%"
					style:top={look.motifs === 'fall' ? '-24px' : `${spot.y}%`}
					style:--y="{spot.y}%"
					style:--delay="{'delay' in spot ? spot.delay : i * -2}s"
					style:--duration="{'duration' in spot ? spot.duration : 12}s"
					style:--sway="{i % 2 ? -18 : 22}px"
					style:--px={spot.size}
				>
					{@render drawing(look.motif, spot.size)}
				</span>
			{/each}
			<span class="companion" style:--px={40}>{@render drawing(look.companion, 40)}</span>
		</span>
	{:else}
		<span class="pair moves-{look.moves}" data-season={season} aria-hidden="true">
			{#if variant === 'pair'}{@render drawing(look.motif, Math.round(size * 0.8), 'small')}{/if}
			<span class="companion">{@render drawing(look.companion, size)}</span>
		</span>
	{/if}
{/if}

<style>
	.scene,
	.pair {
		/* Parts of a drawing turn around their own spot on the 24 grid. */
		--wing-left: 11px 12px;
		--wing-right: 13px 12px;
	}

	/* ---------- The scene, behind the story card's greeting ---------- */

	.scene {
		position: absolute;
		inset: 0;
		overflow: hidden;
		color: var(--accent-dark, var(--brand));
		pointer-events: none;
	}

	/* Drawn larger on a wide card (--k), from the size each one has on a phone (--px). */
	.scene :global(svg) {
		width: calc(var(--px) * var(--k, 1) * 1px);
		height: calc(var(--px) * var(--k, 1) * 1px);
	}

	/* On a wide card, between the greeting and the logo rather than on top of the logo. */
	@media (min-width: 721px) {
		.scene {
			--k: 1.6;
			left: 34%;
			right: 26%;
		}
	}

	.motif {
		position: absolute;
		display: grid;
		opacity: 0.6;
		animation: var(--duration) linear var(--delay) infinite;
	}

	/* Snow, blossoms and leaves drift down and sideways, turning as they go. */
	/* They start above the card (top: -24px) and fall through it. */
	.fall .motif {
		animation-name: fall;
	}

	@keyframes fall {
		0% {
			translate: 0 0;
			rotate: 0deg;
			opacity: 0;
		}
		12%,
		80% {
			opacity: 0.55;
		}
		50% {
			translate: var(--sway) 110px;
		}
		100% {
			translate: 0 230px;
			rotate: 220deg;
			opacity: 0;
		}
	}

	/* Stars glimmer in their places. */
	.twinkle .motif {
		animation-name: twinkle;
		--duration: 3.6s !important;
	}

	@keyframes twinkle {
		0%,
		100% {
			scale: 0.7;
			rotate: 0deg;
			opacity: 0.2;
		}
		50% {
			scale: 1;
			rotate: 18deg;
			opacity: 0.75;
		}
	}

	/* Sparks open like a small firework and fade. */
	.burst .motif {
		animation-name: burst;
		--duration: 4.2s !important;
	}

	@keyframes burst {
		0%,
		30% {
			scale: 0.2;
			opacity: 0;
		}
		50% {
			scale: 1;
			opacity: 0.8;
		}
		100% {
			scale: 1.35;
			opacity: 0;
		}
	}

	/* The sun turns, very slowly. */
	.spin .motif {
		animation-name: spin;
		--duration: 40s !important;
		opacity: 0.55;
	}

	@keyframes spin {
		to {
			rotate: 360deg;
		}
	}

	/* Pumpkins sit and glow a little. */
	.sit .motif {
		animation-name: glow;
		--duration: 4.5s !important;
		opacity: 0.6;
	}

	@keyframes glow {
		50% {
			scale: 1.06;
			opacity: 0.85;
		}
	}

	.scene .companion {
		position: absolute;
		top: 22%;
		left: 76%;
		display: grid;
		opacity: 0.85;
	}

	/* The bat and the butterfly fly a loop over the card. */
	.scene.moves-fly .companion,
	.scene.moves-flutter .companion {
		top: 16%;
		left: 70%;
		animation: loop 14s ease-in-out infinite;
	}

	@keyframes loop {
		0%,
		100% {
			translate: 0 0;
			rotate: -4deg;
		}
		25% {
			translate: -70px -6px;
			rotate: 6deg;
		}
		50% {
			translate: -130px 18px;
			rotate: -2deg;
		}
		75% {
			translate: -50px 30px;
			rotate: 8deg;
		}
	}

	/* The kite tugs on its line; the boat rocks; the snowman and the glass stand. */
	.scene.moves-sway .companion {
		animation: sway 5s ease-in-out infinite alternate;
		transform-origin: 30% 100%;
	}

	@keyframes sway {
		from {
			translate: 0 0;
			rotate: -8deg;
		}
		to {
			translate: -14px -8px;
			rotate: 10deg;
		}
	}

	.scene.moves-bob .companion {
		top: auto;
		bottom: 10%;
	}

	.scene.moves-wave .companion,
	.scene.moves-fizz .companion,
	.scene.moves-flicker .companion {
		top: auto;
		bottom: 12%;
	}

	/* ---------- The moving parts, in the scene and (a few times) in a pair ---------- */

	.companion :global(.part) {
		transform-box: view-box;
	}

	.companion :global(.wing.left) {
		transform-origin: var(--wing-left);
	}

	.companion :global(.wing.right) {
		transform-origin: var(--wing-right);
	}

	.moves-fly .companion :global(.wing.left) {
		animation: flap-left 0.32s ease-in-out infinite alternate;
	}

	.moves-fly .companion :global(.wing.right) {
		animation: flap-right 0.32s ease-in-out infinite alternate;
	}

	@keyframes flap-left {
		from {
			rotate: -14deg;
		}
		to {
			rotate: 22deg;
		}
	}

	@keyframes flap-right {
		from {
			rotate: 14deg;
		}
		to {
			rotate: -22deg;
		}
	}

	.moves-flutter .companion :global(.wing) {
		animation: flutter 0.45s ease-in-out infinite alternate;
	}

	@keyframes flutter {
		to {
			scale: 0.35 1;
		}
	}

	.moves-wave .companion :global(.arm) {
		transform-origin: 16.4px 14.2px;
		animation: wave 1.6s ease-in-out infinite;
	}

	@keyframes wave {
		0%,
		60%,
		100% {
			rotate: 0deg;
		}
		20% {
			rotate: -28deg;
		}
		40% {
			rotate: 6deg;
		}
	}

	.moves-flicker .companion :global(.flame) {
		transform-origin: 12px 9.4px;
		animation: flicker 0.7s ease-in-out infinite alternate;
	}

	@keyframes flicker {
		from {
			scale: 0.9 1;
			rotate: -4deg;
		}
		to {
			scale: 1.05 1.12;
			rotate: 4deg;
		}
	}

	.moves-fizz .companion :global(.bubble) {
		animation: fizz 2.2s ease-out infinite;
	}

	.moves-fizz .companion :global(.bubble.late) {
		animation-delay: -1.1s;
	}

	@keyframes fizz {
		0% {
			translate: 0 0;
			opacity: 0;
		}
		30% {
			opacity: 1;
		}
		100% {
			translate: 0.4px -4px;
			opacity: 0;
		}
	}

	.moves-bob .companion :global(.boat) {
		transform-origin: 12px 18px;
		animation: rock 3.2s ease-in-out infinite alternate;
	}

	@keyframes rock {
		from {
			translate: 0 0;
			rotate: -5deg;
		}
		to {
			translate: 0 1.2px;
			rotate: 5deg;
		}
	}

	.moves-sway .companion :global(.tail) {
		transform-box: fill-box;
		transform-origin: top center;
		animation: tail 1.4s ease-in-out infinite alternate;
	}

	@keyframes tail {
		from {
			rotate: -10deg;
		}
		to {
			rotate: 12deg;
		}
	}

	/* ---------- A pair, small: arrives with a hop, moves a few times, then rests ---------- */

	.pair {
		display: inline-flex;
		align-items: flex-end;
		gap: 2px;
	}

	.pair .companion {
		display: grid;
		animation: hop 0.6s var(--ease) both;
	}

	.pair .companion :global(.part) {
		animation-iteration-count: 6 !important;
	}

	.pair :global(.small) {
		opacity: 0.7;
	}

	@keyframes hop {
		0% {
			translate: 0 6px;
			scale: 0.6;
			opacity: 0;
		}
		60% {
			translate: 0 -2px;
			scale: 1.05;
			opacity: 1;
		}
		100% {
			translate: 0 0;
			scale: 1;
		}
	}

	/* Standing still for those who asked for less motion, not sped up: a looping drawing would flicker. */
	@media (prefers-reduced-motion: reduce) {
		.scene *,
		.pair *,
		.companion :global(*) {
			animation: none !important;
		}

		/* Snow that doesn't fall lies where it would have been. */
		.fall .motif {
			top: var(--y) !important;
		}
	}
</style>
