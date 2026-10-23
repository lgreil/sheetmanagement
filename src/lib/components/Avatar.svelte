<script lang="ts">
	import { glyphOf } from '#lib/music/instrument-glyph.ts';
	import InstrumentGlyph from './InstrumentGlyph.svelte';

	/**
	 * A member's picture: the drawing of their instrument (#136), so nobody has to upload a
	 * photo and nothing has to be stored; without an instrument, the first letter of the name.
	 */
	let { name, instrument, size = 36 }: { name: string; instrument?: string; size?: number } = $props();

	const glyph = $derived(instrument ? glyphOf(instrument) : null);
</script>

<span class="avatar" style:--size="{size}px" aria-hidden="true">
	{#if glyph}<InstrumentGlyph {glyph} size={Math.round(size * 0.62)} />{:else}{name.charAt(0).toUpperCase()}{/if}
</span>

<style>
	.avatar {
		display: grid;
		place-items: center;
		flex: none;
		width: var(--size);
		height: var(--size);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: calc(var(--size) * 0.4);
		font-weight: 700;
		line-height: 1;
	}
</style>
