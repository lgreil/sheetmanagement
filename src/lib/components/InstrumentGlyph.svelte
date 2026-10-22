<script lang="ts" module>
	import type { Glyph } from '#lib/music/instrument-glyph.ts';

	// Small drawings of instruments for the instrument picker, drawn for the app on a 24 grid with
	// round strokes as heavy as the Phosphor bold icons. `fill` parts are solid (black keys, holes);
	// `tilt` turns a drawing, as a violin is held.
	const glyphs: Record<Glyph, { line: string; fill?: string; tilt?: number }> = {
		violin: {
			line: 'M12 3v7M10.6 2.5h2.8M12 10c-2.6 0-3.6 1.3-3.2 3.1.3 1.2-.8 1.6-.8 3.4 0 2.9 1.8 4.9 4 4.9s4-2 4-4.9c0-1.8-1.1-2.2-.8-3.4.4-1.8-.6-3.1-3.2-3.1ZM10.5 17.5h3',
			tilt: 35
		},
		cello: {
			line: 'M12 1.5v5M12 6.5c-3.2 0-4.4 1.6-4 3.8.3 1.4-1 2-1 4.2 0 3.3 2.2 5.5 5 5.5s5-2.2 5-5.5c0-2.2-1.3-2.8-1-4.2.4-2.2-.8-3.8-4-3.8ZM12 20v2.5M10.3 15.5h3.4'
		},
		flute: {
			line: 'M3.5 20.5 20.5 3.5M15.5 5.5l3 3',
			fill: 'M10.4 13.6a1.1 1.1 0 1 1-1.56-1.56 1.1 1.1 0 0 1 1.56 1.56ZM13.4 10.6a1.1 1.1 0 1 1-1.56-1.56 1.1 1.1 0 0 1 1.56 1.56ZM7.4 16.6a1.1 1.1 0 1 1-1.56-1.56 1.1 1.1 0 0 1 1.56 1.56Z'
		},
		clarinet: {
			line: 'M12 2.5v14M10.8 2.5h2.4M12 16.5l-3.2 5h6.4Z',
			fill: 'M15.2 7a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM15.2 10.5a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM15.2 14a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z'
		},
		sax: {
			line: 'M6.5 2.5 10 4v10.5a4 4 0 0 0 8 0V10M15.5 6.5h5l-1.5 3.5h-2Z',
			fill: 'M14 8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM14 11.5a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z'
		},
		horn: {
			line: 'M17 13a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM13.5 13a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM15.2 8.8l3.3-3.3M16.5 3.5l4 4M5 13H2.5'
		},
		trumpet: {
			line: 'M2.5 12H15M15 12l6-3.5v7ZM5.5 12v4h9v-4M8.5 12V8M12 12V8M7.5 8h2M11 8h2'
		},
		trombone: {
			line: 'M8.5 9H19a2.5 2.5 0 0 1 0 5H5M8.5 9 3 5.5v7ZM12 9v5'
		},
		tuba: {
			line: 'M6.5 3h11l-3 5h-5ZM9.5 8v8.5a3.5 3.5 0 0 0 7 0V13M16.5 13H20'
		},
		timpani: {
			line: 'M3 9.5h18M3.5 9.5a8.5 7 0 0 0 17 0M7.5 15.5 6 21M16.5 15.5 18 21M9 6.5 6 3'
		},
		drum: {
			line: 'M20 10c0 1.7-3.6 3-8 3s-8-1.3-8-3 3.6-3 8-3 8 1.3 8 3ZM4 10v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7M9 6.5 5.5 3M15 6.5 18.5 3'
		},
		cymbal: {
			line: 'M2.5 12.5c3-2.5 16-2.5 19 0M10.3 10.3a1.7 1.7 0 0 1 3.4 0M12 12v9.5M8.5 21.5h7'
		},
		mallets: {
			line: 'M4.5 6.5v11M8.5 7.5v9M12.5 8.5v7M16.5 9.5v5M20 10.5v3'
		},
		keys: {
			line: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM9 13v7M15 13v7',
			fill: 'M7.5 4h3v9h-3ZM13.5 4h3v9h-3Z'
		},
		harp: {
			line: 'M6 21.5V3c4.5 0 6.5 4.5 13 6.5L9 21.5ZM9.5 6v11M13 8.5v4.5'
		},
		voice: {
			line: 'M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0ZM6 11a6 6 0 0 0 12 0M12 17v4.5M9 21.5h6'
		},
		score: {
			line: 'M6 2.5h12a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1ZM8.5 7h7M8.5 10h7M8.5 13h7M8.5 16h4'
		}
	};
</script>

<script lang="ts">
	let { glyph, size = 24 }: { glyph: Glyph; size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
	<g transform={glyphs[glyph].tilt ? `rotate(${glyphs[glyph].tilt} 12 12)` : undefined}>
		<path d={glyphs[glyph].line} fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
		{#if glyphs[glyph].fill}<path d={glyphs[glyph].fill} fill="currentColor" />{/if}
	</g>
</svg>
