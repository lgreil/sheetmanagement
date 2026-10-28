<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Glyph } from '#lib/music/instrument-glyph.ts';
	import InstrumentGlyph from './InstrumentGlyph.svelte';
	import SeasonMark from './SeasonMark.svelte';

	/**
	 * When a search or a list comes up empty: a few instruments waiting, the reason, and what to
	 * do next (a button), instead of a lone grey line.
	 */
	let { text, glyphs = ['violin', 'flute', 'horn'], children }: { text: string; glyphs?: Glyph[]; children?: Snippet } = $props();
</script>

<div class="nothing">
	<span class="trio" aria-hidden="true">
		{#each glyphs as glyph, i (i)}
			<span class="glyph" style:--i={i}>
				<InstrumentGlyph {glyph} size={28} />
				{#if i === 1}<span class="season-mark"><SeasonMark variant="companion" size={20} /></span>{/if}
			</span>
		{/each}
	</span>
	<p>{text}</p>
	{@render children?.()}
</div>

<style>
	.nothing {
		display: grid;
		justify-items: center;
		gap: var(--space-3);
		padding: var(--space-6) var(--space-4);
		color: var(--text-muted);
		text-align: center;
	}

	.trio {
		display: flex;
		gap: var(--space-2);
	}

	.glyph {
		position: relative;
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--surface-2);
		color: color-mix(in oklab, var(--text-muted) 70%, transparent);
		animation: bob 3.2s var(--ease) infinite;
		animation-delay: calc(var(--i) * 0.35s);
	}

	/* The middle one a little higher, like a small ensemble. */
	.glyph:nth-child(2) {
		transform: translateY(-6px);
		background: var(--accent-soft);
		color: var(--accent);
	}

	/* The season's drawing on the middle one's shoulder (#202). */
	.season-mark {
		position: absolute;
		top: -10px;
		right: -12px;
		display: grid;
		color: var(--accent);
		rotate: 12deg;
	}

	@keyframes bob {
		50% {
			translate: 0 -3px;
		}
	}

	p {
		max-width: 42ch;
		margin: 0;
	}
</style>
