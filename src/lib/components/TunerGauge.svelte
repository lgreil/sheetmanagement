<script lang="ts">
	/**
	 * A tuner's analogue gauge, drawn: a needle over a scale from −50 to +50 cents with the
	 * in-tune band in the middle, on a dark face like a clip-on or desk tuner.
	 */
	let { cents, verdict, quiet = false }: { cents: number | null; verdict: 'ok' | 'low' | 'high' | null; quiet?: boolean } = $props();

	const PIVOT = { x: 130, y: 150 };
	const RADIUS = 112;
	/** Degrees from straight up for a number of cents: the scale spans ±55°. */
	const angle = (value: number) => Math.max(-50, Math.min(50, value)) * 1.1;
	const at = (value: number, radius: number) => {
		const rad = (angle(value) * Math.PI) / 180;
		return { x: PIVOT.x + Math.sin(rad) * radius, y: PIVOT.y - Math.cos(rad) * radius };
	};
	const ticks = Array.from({ length: 21 }, (_, i) => -50 + i * 5);
	const arc = (from: number, to: number, radius: number) => {
		const [a, b] = [at(from, radius), at(to, radius)];
		return `M${a.x} ${a.y} A${radius} ${radius} 0 0 1 ${b.x} ${b.y}`;
	};
</script>

<svg class="gauge" class:quiet viewBox="0 0 260 160" role="img" aria-hidden="true">
	<!-- The scale: red at the ends, green in the middle. -->
	<path d={arc(-50, -15, RADIUS + 8)} class="band far" />
	<path d={arc(-15, -5, RADIUS + 8)} class="band near" />
	<path d={arc(-5, 5, RADIUS + 8)} class="band ok" class:lit={verdict === 'ok'} />
	<path d={arc(5, 15, RADIUS + 8)} class="band near" />
	<path d={arc(15, 50, RADIUS + 8)} class="band far" />
	{#each ticks as tick (tick)}
		{@const major = tick % 10 === 0}
		{@const [outer, inner] = [at(tick, RADIUS), at(tick, RADIUS - (major ? 14 : 8))]}
		<line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} class="tick" class:major />
	{/each}
	{#each [-50, -25, 0, 25, 50] as label (label)}
		{@const point = at(label, RADIUS - 26)}
		<text x={point.x} y={point.y + 4} class="label">{label > 0 ? `+${label}` : label}</text>
	{/each}
	<text x={PIVOT.x - 70} y={PIVOT.y - 14} class="sign">♭</text>
	<text x={PIVOT.x + 70} y={PIVOT.y - 14} class="sign">♯</text>

	<!-- The needle, slow enough to read and quick enough to follow a bow. -->
	<g class="needle" style:transform="rotate({angle(cents ?? 0)}deg)" style:transform-origin="{PIVOT.x}px {PIVOT.y}px">
		<path d="M{PIVOT.x - 2.2} {PIVOT.y} L{PIVOT.x - 0.6} {PIVOT.y - RADIUS + 4} L{PIVOT.x + 0.6} {PIVOT.y - RADIUS + 4} L{PIVOT.x + 2.2} {PIVOT.y} Z" />
	</g>
	<circle cx={PIVOT.x} cy={PIVOT.y} r="9" class="hub" />
	<circle cx={PIVOT.x} cy={PIVOT.y} r="3" class="hub-dot" />
</svg>

<style>
	.gauge {
		display: block;
		width: 100%;
		height: auto;
	}

	.band {
		fill: none;
		stroke-width: 6;
		stroke-linecap: butt;
	}

	.band.far {
		stroke: #b8453a;
		opacity: 0.55;
	}

	.band.near {
		stroke: #d29a32;
		opacity: 0.6;
	}

	.band.ok {
		stroke: #3fae6a;
		opacity: 0.7;
		transition:
			opacity 0.2s,
			filter 0.2s;
	}

	.band.ok.lit {
		opacity: 1;
		filter: drop-shadow(0 0 4px #4ade80);
	}

	.tick {
		stroke: #b9c0c7;
		stroke-width: 1.2;
	}

	.tick.major {
		stroke: #eef2f5;
		stroke-width: 2;
	}

	.label {
		fill: #c9d0d6;
		font: 600 10px/1 var(--font);
		text-anchor: middle;
		font-variant-numeric: tabular-nums;
	}

	.sign {
		fill: #8a939b;
		font: 20px/1 'Noto Music', 'Segoe UI Symbol', 'Apple Symbols', serif;
		text-anchor: middle;
	}

	.needle {
		fill: #ff6b4a;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.5));
		transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.3, 1);
	}

	.quiet .needle {
		fill: #9aa3ab;
	}

	.hub {
		fill: #2c3238;
		stroke: #59626b;
		stroke-width: 1.5;
	}

	.hub-dot {
		fill: #aab2ba;
	}
</style>
