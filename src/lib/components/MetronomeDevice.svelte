<script lang="ts">
	import { MAX_BPM, MIN_BPM } from '#lib/practice/audio.ts';

	/**
	 * A wooden pyramid metronome, drawn: the pendulum swings to one side per click and the
	 * sliding weight sits high on the rod for slow tempi and low for fast ones, against the
	 * scale printed on the face, as on a mechanical one.
	 */
	let {
		bpm,
		side,
		accent = false
	}: {
		bpm: number;
		/** Where the pendulum is headed: -1 left, 1 right, 0 at rest. */
		side: -1 | 0 | 1;
		/** The bar's first beat just sounded: the weight flashes. */
		accent?: boolean;
	} = $props();

	const PIVOT = { x: 100, y: 206 };
	/** The weight's height on the rod: a log scale, like the printed one. */
	const weightY = (tempo: number) => 56 + (Math.log(tempo / MIN_BPM) / Math.log(MAX_BPM / MIN_BPM)) * 116;
	/** The printed scale: the usual marks, spaced so the numbers stay readable. */
	const SCALE = [40, 52, 66, 84, 108, 138, 176, 208];
	/** The face's half-width at a height, so the ticks sit on its edge. */
	const faceHalf = (y: number) => 18 + ((y - 30) / (204 - 30)) * 44;

	// Each instance its own gradients.
	const id = `metronome-${Math.random().toString(36).slice(2, 8)}`;
	const swing = $derived(side * 24);
	const seconds = $derived(side ? 60 / bpm : 0.6);
</script>

<svg class="device" viewBox="0 0 200 252" role="img" aria-hidden="true">
	<defs>
		<linearGradient id="{id}-wood" x1="0" x2="1">
			<stop offset="0" stop-color="#5a3519" />
			<stop offset="0.45" stop-color="#8b5a31" />
			<stop offset="0.55" stop-color="#93623a" />
			<stop offset="1" stop-color="#4e2d15" />
		</linearGradient>
		<linearGradient id="{id}-face" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#f6ecd8" />
			<stop offset="1" stop-color="#e6d3b0" />
		</linearGradient>
		<linearGradient id="{id}-metal" x1="0" x2="1">
			<stop offset="0" stop-color="#9aa0a8" />
			<stop offset="0.5" stop-color="#eef0f3" />
			<stop offset="1" stop-color="#8d939b" />
		</linearGradient>
		<linearGradient id="{id}-brass" x1="0" x2="1">
			<stop offset="0" stop-color="#9c7a2c" />
			<stop offset="0.5" stop-color="#f1d27a" />
			<stop offset="1" stop-color="#8a6a22" />
		</linearGradient>
	</defs>

	<!-- Shadow, body and base. -->
	<ellipse cx="100" cy="246" rx="86" ry="5" class="shadow" />
	<path d="M72 8 Q100 2 128 8 L184 226 Q186 236 176 236 L24 236 Q14 236 16 226 Z" fill="url(#{id}-wood)" />
	<path d="M10 232 L190 232 Q194 232 194 237 L194 242 Q194 245 190 245 L10 245 Q6 245 6 242 L6 237 Q6 232 10 232 Z" fill="#4a2a13" />
	<!-- The face with its tempo scale. -->
	<path d="M82 26 L118 26 L162 204 L38 204 Z" fill="url(#{id}-face)" />
	{#each SCALE as mark (mark)}
		{@const y = weightY(mark)}
		<line x1={PIVOT.x + faceHalf(y) - 9} y1={y} x2={PIVOT.x + faceHalf(y) - 2} y2={y} class="tick" />
		<text x={PIVOT.x + faceHalf(y) - 12} y={y + 2.5} class="mark">{mark}</text>
		<line x1={PIVOT.x - faceHalf(y) + 2} y1={y} x2={PIVOT.x - faceHalf(y) + 7} y2={y} class="tick" />
	{/each}

	<!-- The pendulum: one swing per click, arriving as the next one sounds. -->
	<g class="pendulum" style:transform="rotate({swing}deg)" style:transition-duration="{seconds}s" style:transform-origin="{PIVOT.x}px {PIVOT.y}px">
		<rect x="98.5" y="22" width="3" height={PIVOT.y - 22} rx="1.5" fill="url(#{id}-metal)" />
		<g class="weight" class:accent>
			<path d="M88 {weightY(bpm) - 8} L112 {weightY(bpm) - 8} L108 {weightY(bpm) + 8} L92 {weightY(bpm) + 8} Z" fill="url(#{id}-brass)" />
			<rect x="91" y={weightY(bpm) - 2} width="18" height="2" fill="#6b5115" opacity="0.5" />
		</g>
	</g>
	<circle cx={PIVOT.x} cy={PIVOT.y} r="5" fill="url(#{id}-metal)" />
	<circle cx={PIVOT.x} cy={PIVOT.y} r="1.6" fill="#555" />
</svg>

<style>
	.device {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.shadow {
		fill: rgb(0 0 0 / 0.18);
	}

	.tick {
		stroke: #7a5532;
		stroke-width: 1;
	}

	.mark {
		fill: #6b4a2b;
		font: 600 7px/1 var(--font);
		text-anchor: end;
	}

	.pendulum {
		transition-property: transform;
		transition-timing-function: cubic-bezier(0.37, 0, 0.63, 1);
	}

	.weight path {
		transition: filter 0.12s;
	}

	.weight.accent path {
		filter: brightness(1.35) drop-shadow(0 0 3px #f1d27a);
	}

	@media (prefers-reduced-motion: reduce) {
		.pendulum {
			transition: none;
		}
	}
</style>
