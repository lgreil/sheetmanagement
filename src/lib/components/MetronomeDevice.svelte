<script lang="ts">
	import { clampBpm, MAX_BPM, MIN_BPM } from '#lib/practice/audio.ts';

	/**
	 * A wooden pyramid metronome, drawn: the pendulum swings to one side per click, and the
	 * sliding weight sits high on the rod for slow tempi and low for fast ones, against the scale
	 * printed on the face, as on a mechanical one. Dragging the weight, or tapping the scale,
	 * sets the tempo; with the keyboard it's a slider.
	 */
	let {
		bpm,
		side,
		accent = false,
		label,
		onchange
	}: {
		bpm: number;
		/** Where the pendulum is headed: -1 left, 1 right, 0 at rest. */
		side: -1 | 0 | 1;
		/** The bar's first beat just sounded: the weight flashes. */
		accent?: boolean;
		/** The slider's name for screen readers. */
		label: string;
		onchange: (bpm: number) => void;
	} = $props();

	const PIVOT = { x: 100, y: 206 };
	const TOP = 56;
	const SPAN = 116;
	const ratio = Math.log(MAX_BPM / MIN_BPM);
	/** The weight's height on the rod: a log scale, like the printed one. */
	const weightY = (tempo: number) => TOP + (Math.log(tempo / MIN_BPM) / ratio) * SPAN;
	const tempoAt = (y: number) => clampBpm(MIN_BPM * Math.exp(((y - TOP) / SPAN) * ratio));
	/** The printed scale: the usual marks, spaced so the numbers stay readable. */
	const SCALE = [40, 52, 66, 84, 108, 138, 176, 208];
	/** The face's half-width at a height, so the ticks sit on its edge. */
	const faceHalf = (y: number) => 18 + ((y - 30) / (204 - 30)) * 44;

	// Each instance its own gradients.
	const id = `metronome-${Math.random().toString(36).slice(2, 8)}`;
	let svg = $state<SVGSVGElement>();
	let dragging = $state(false);
	// While the weight is held the pendulum rests, as it would under a finger.
	const swing = $derived(dragging ? 0 : side * 24);
	const seconds = $derived(side && !dragging ? 60 / bpm : 0.6);

	/** The tempo where the pointer is on the rod. */
	function follow(event: PointerEvent) {
		const matrix = svg?.getScreenCTM();
		if (!matrix) return;
		const y = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()).y;
		onchange(tempoAt(y));
	}

	function grab(event: PointerEvent) {
		event.preventDefault();
		(event.currentTarget as Element).setPointerCapture?.(event.pointerId);
		dragging = true;
		follow(event);
	}
	function drag(event: PointerEvent) {
		if (dragging) follow(event);
	}
	function release() {
		dragging = false;
	}

	function onkeydown(event: KeyboardEvent) {
		const by = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[event.key];
		if (event.key === 'Home') onchange(MIN_BPM);
		else if (event.key === 'End') onchange(MAX_BPM);
		else if (by) onchange(clampBpm(bpm + by));
		else return;
		event.preventDefault();
	}
</script>

<svg class="device" class:dragging viewBox="0 0 200 252" bind:this={svg}>
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

	<g aria-hidden="true">
		<!-- Shadow, body and base. -->
		<ellipse cx="100" cy="246" rx="86" ry="5" class="shadow" />
		<path d="M72 8 Q100 2 128 8 L184 226 Q186 236 176 236 L24 236 Q14 236 16 226 Z" fill="url(#{id}-wood)" />
		<path d="M10 232 L190 232 Q194 232 194 237 L194 242 Q194 245 190 245 L10 245 Q6 245 6 242 L6 237 Q6 232 10 232 Z" fill="#4a2a13" />
		<!-- The face with its tempo scale; tapping it moves the weight there. A bigger target for
		     pointers only: the keyboard has the weight's slider for the same. -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<path d="M82 26 L118 26 L162 204 L38 204 Z" fill="url(#{id}-face)" class="face" onpointerdown={grab} onpointermove={drag} onpointerup={release} onpointercancel={release} />
		{#each SCALE as mark (mark)}
			{@const y = weightY(mark)}
			<line x1={PIVOT.x + faceHalf(y) - 9} y1={y} x2={PIVOT.x + faceHalf(y) - 2} y2={y} class="tick" />
			<text x={PIVOT.x + faceHalf(y) - 12} y={y + 2.5} class="mark">{mark}</text>
			<line x1={PIVOT.x - faceHalf(y) + 2} y1={y} x2={PIVOT.x - faceHalf(y) + 7} y2={y} class="tick" />
		{/each}
	</g>

	<!-- The pendulum: one swing per click, arriving as the next one sounds. -->
	<g class="pendulum" style:transform="rotate({swing}deg)" style:transition-duration="{seconds}s" style:transform-origin="{PIVOT.x}px {PIVOT.y}px">
		<rect x="98.5" y="22" width="3" height={PIVOT.y - 22} rx="1.5" fill="url(#{id}-metal)" aria-hidden="true" />
		<!-- The weight: drag it up for slower, down for faster. -->
		<g
			class="weight"
			class:accent
			role="slider"
			tabindex="0"
			aria-label={label}
			aria-valuemin={MIN_BPM}
			aria-valuemax={MAX_BPM}
			aria-valuenow={bpm}
			aria-orientation="vertical"
			onpointerdown={grab}
			onpointermove={drag}
			onpointerup={release}
			onpointercancel={release}
			{onkeydown}
		>
			<!-- A bigger target than the weight itself, for fingers. -->
			<rect x="72" y={weightY(bpm) - 18} width="56" height="36" class="target" />
			<path d="M86 {weightY(bpm) - 9} L114 {weightY(bpm) - 9} L109 {weightY(bpm) + 9} L91 {weightY(bpm) + 9} Z" fill="url(#{id}-brass)" class="body" />
			<rect x="90" y={weightY(bpm) - 2} width="20" height="2" fill="#6b5115" opacity="0.5" />
			<path d="M96 {weightY(bpm) - 15} l4 -4 l4 4 M96 {weightY(bpm) + 15} l4 4 l4 -4" class="grip" />
		</g>
	</g>
	<circle cx={PIVOT.x} cy={PIVOT.y} r="5" fill="url(#{id}-metal)" aria-hidden="true" />
	<circle cx={PIVOT.x} cy={PIVOT.y} r="1.6" fill="#555" aria-hidden="true" />
</svg>

<style>
	.device {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
		touch-action: none;
	}

	.shadow {
		fill: rgb(0 0 0 / 0.18);
	}

	.face {
		cursor: pointer;
	}

	.tick {
		stroke: #7a5532;
		stroke-width: 1;
		pointer-events: none;
	}

	.mark {
		fill: #6b4a2b;
		font: 600 7px/1 var(--font);
		text-anchor: end;
		pointer-events: none;
	}

	.pendulum {
		transition-property: transform;
		transition-timing-function: cubic-bezier(0.37, 0, 0.63, 1);
	}

	.weight {
		cursor: grab;
		outline: none;
	}

	.dragging .weight {
		cursor: grabbing;
	}

	.target {
		fill: transparent;
	}

	.weight .body {
		transition: filter 0.12s;
	}

	.weight.accent .body {
		filter: brightness(1.35) drop-shadow(0 0 3px #f1d27a);
	}

	/* The arrows say it can be moved; stronger while held or focused. */
	.grip {
		fill: none;
		stroke: #8a6a22;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
		opacity: 0.55;
		transition: opacity 0.15s;
	}

	.weight:hover .grip,
	.weight:focus-visible .grip,
	.dragging .grip {
		opacity: 1;
	}

	.weight:focus-visible .body {
		stroke: var(--accent);
		stroke-width: 2;
	}

	@media (prefers-reduced-motion: reduce) {
		.pendulum {
			transition: none;
		}
	}
</style>
