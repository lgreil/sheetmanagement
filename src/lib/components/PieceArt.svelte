<script lang="ts">
	import type { ArtKey } from '#lib/music/piece-art.ts';

	/**
	 * Line drawings for a piece's banner, in the banner's text colour, so they suit every
	 * orchestra's colour in light and dark. Purely decorative: screen readers skip them.
	 */
	let { art }: { art: ArtKey } = $props();
</script>

<svg class="art" viewBox="0 0 120 120" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
	{#if art === 'weihnachten'}
		<!-- A Christmas tree with a star, baubles and a garland. -->
		<path d="M60 8l2.9 6 6.5.8-4.8 4.5 1.3 6.4L60 22.5l-5.9 3.2 1.3-6.4-4.8-4.5 6.5-.8z" fill="currentColor" />
		<path d="M60 28 40 54h11L33 79h13L26 102h68L74 79h13L69 54h11z" />
		<path d="M44 50q16 9 32-1M38 75q22 11 44-2" stroke-width="1.6" />
		<path d="M54 102v12h12v-12" />
		<g fill="currentColor" stroke="none">
			<circle cx="52" cy="62" r="3" /><circle cx="70" cy="66" r="3" /><circle cx="45" cy="90" r="3" />
			<circle cx="62" cy="86" r="3" /><circle cx="78" cy="94" r="3" /><circle cx="60" cy="44" r="2.5" />
		</g>
	{:else if art === 'filmmusik'}
		<!-- A film reel with its strip running into a clapperboard. -->
		<circle cx="42" cy="50" r="30" />
		<circle cx="42" cy="50" r="5" />
		{#each [0, 72, 144, 216, 288] as angle (angle)}
			<circle cx={42 + 17 * Math.cos(((angle - 90) * Math.PI) / 180)} cy={50 + 17 * Math.sin(((angle - 90) * Math.PI) / 180)} r="6.5" />
		{/each}
		<path d="M42 80c10 18 30 24 50 22" />
		<path d="M66 70h46v36H66z" />
		<path d="M64 62l44-12 3 8-44 12z" />
		<path d="M75 59.5l5 8.5M87 56l5 8.5M99 53l5 8.5" stroke-width="1.8" />
	{:else if art === 'musical'}
		<!-- The two theatre masks, laughing and crying. -->
		<path d="M14 26q22-10 44 0 2 34-22 50Q12 60 14 26z" />
		<path d="M24 38q4-4 8 0M40 38q4-4 8 0M26 54q10 8 20 0" />
		<path d="M62 46q22-10 44 0 2 34-22 50Q60 80 62 46z" />
		<path d="M72 60q4 4 8 0M88 60q4 4 8 0M74 80q10-8 20 0" />
		<path d="M14 26c-4-8-8-10-10-6M106 46c4-8 8-10 10-6" stroke-width="1.6" />
	{:else if art === 'oper'}
		<!-- Stage curtains with their swags, and the light on the stage. -->
		<path d="M6 12h108" />
		<path d="M6 12q27 20 54 0 27 20 54 0" />
		<path d="M8 14c4 34 14 62 6 96h16c-3-30 3-58 14-80" />
		<path d="M112 14c-4 34-14 62-6 96H90c3-30-3-58-14-80" />
		<path d="M4 110h112" />
		<path d="M60 26v8M48 46l-8 50M72 46l8 50" stroke-width="1.4" stroke-dasharray="2 5" />
		<circle cx="60" cy="38" r="4" />
	{:else if art === 'jazz'}
		<!-- A saxophone: mouthpiece, neck, the body with its keys, the bend and the flared bell. -->
		<path d="M78 30v54q0 24-24 24-20 0-26-16L18 70q14-10 28-6l-2 20q2 10 10 10t8-10V32" />
		<path d="M64 32q0-8 7-9 7 0 7 7" />
		<path d="M71 23q-6-11-24-11H30" stroke-width="3.2" />
		<path d="M30 12l-8 2" stroke-width="4" />
		<path d="M18 70q12-4 28-6" stroke-width="1.6" />
		<g fill="currentColor" stroke="none">
			<circle cx="71" cy="44" r="3.4" /><circle cx="71" cy="56" r="3.4" /><circle cx="71" cy="68" r="3.4" /><circle cx="66" cy="96" r="3" />
		</g>
		<path d="M78 50h6M78 62h6" stroke-width="1.6" />
		<path d="M92 30c5 5 7 12 5 19M102 24c8 9 10 20 7 31" stroke-width="1.6" />
	{:else if art === 'pop-rock'}
		<!-- A guitar, tilted like on a stage, with a few lines of sound. -->
		<g transform="rotate(35 60 70)">
			<path d="M60 50c-11 0-16 7-14 15 1 4-1 6-4 8-8 6-6 35 18 35s26-29 18-35c-3-2-5-4-4-8 2-8-3-15-14-15z" />
			<circle cx="60" cy="80" r="6" />
			<path d="M53 96h14" stroke-width="3" />
			<path d="M57 50V14h6v36" />
			<path d="M55 14l1-9h8l1 9z" />
			<path d="M58.5 16v78M61.5 16v78" stroke-width="0.8" />
		</g>
		<path d="M16 34l8 6M12 50h10M24 20l4 9" stroke-width="1.6" />
		<path d="M100 92l-6 10h8l-6 10" stroke-width="1.8" />
	{:else if art === 'marsch-blasmusik'}
		<!-- A snare drum with its rims and tension rods, and the sticks crossed above it. -->
		<path d="M26 56q34 18 68 0" />
		<path d="M26 52a34 10 0 1 0 68 0 34 10 0 1 0-68 0z" />
		<path d="M26 52v30q34 22 68 0V52" />
		<path d="M26 78q34 20 68 0" />
		<path d="M36 64v24M48 66v26M60 67v27M72 66v26M84 64v24" stroke-width="1.6" />
		<path d="M24 12l34 34M96 12L62 46" stroke-width="3" />
		<circle cx="59" cy="47" r="2.6" fill="currentColor" stroke="none" />
		<circle cx="61" cy="47" r="2.6" fill="currentColor" stroke="none" />
	{:else if art === 'tanz-walzer'}
		<!-- The waltz's um-pa-pa: three-four time, a bass note and two chords. -->
		{#each [40, 50, 60, 70, 80] as y (y)}<path d="M4 {y}h112" stroke-width="1.4" />{/each}
		<text x="20" y="59" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" fill="currentColor" stroke="none" text-anchor="middle">3</text>
		<text x="20" y="79" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" fill="currentColor" stroke="none" text-anchor="middle">4</text>
		<g fill="currentColor" stroke="none">
			<ellipse cx="44" cy="80" rx="5.4" ry="3.9" transform="rotate(-20 44 80)" />
			<ellipse cx="70" cy="55" rx="5.4" ry="3.9" transform="rotate(-20 70 55)" />
			<ellipse cx="70" cy="45" rx="5.4" ry="3.9" transform="rotate(-20 70 45)" />
			<ellipse cx="94" cy="55" rx="5.4" ry="3.9" transform="rotate(-20 94 55)" />
			<ellipse cx="94" cy="45" rx="5.4" ry="3.9" transform="rotate(-20 94 45)" />
		</g>
		<path d="M49.2 78V46M75.2 53V20M99.2 53V20" />
		<path d="M112 40v40" />
	{:else if art === 'staff'}
		<!-- Notes on a staff. -->
		{#each [36, 48, 60, 72, 84] as y (y)}<path d="M4 {y}h112" stroke-width="1.4" />{/each}
		<ellipse cx="34" cy="66" rx="7" ry="5" transform="rotate(-20 34 66)" fill="currentColor" stroke="none" />
		<path d="M40.5 64V28" />
		<ellipse cx="70" cy="78" rx="7" ry="5" transform="rotate(-20 70 78)" fill="currentColor" stroke="none" />
		<ellipse cx="98" cy="60" rx="7" ry="5" transform="rotate(-20 98 60)" fill="currentColor" stroke="none" />
		<path d="M76.5 76V40l28-6v24" />
		<path d="M76.5 40l28-6v6l-28 6z" fill="currentColor" />
	{:else}
		<!-- A violin with its strings, f-holes and scroll. -->
		<path d="M60 34c-15 0-21 10-17 20 3 6 3 10-1 14-9 10-7 40 18 42 25-2 27-32 18-42-4-4-4-8-1-14 4-10-2-20-17-20z" />
		<path d="M57 34V10h6v24" />
		<circle cx="60" cy="7" r="4" />
		<path d="M53 14h-4M53 20h-4M67 14h4M67 20h4" stroke-width="1.6" />
		<path d="M50 70q-5 9 0 18M70 70q5 9 0 18" stroke-width="1.8" />
		<path d="M52 82h16" />
		<path d="M56 94l4 12 4-12z" />
		<path d="M58.5 12v82M61.5 12v82" stroke-width="0.8" />
	{/if}
</svg>

<style>
	.art {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
