<script lang="ts">
	import type { TreeStage } from '#lib/practice/practice.ts';

	/**
	 * The practice tree: a seed in the soil, a seedling, a small tree, then a tree whose trunk
	 * and crown grow a little with every further stage (they stop growing at some point; the
	 * rings keep counting). Drawn on a 200 × 160 grid, in the theme's colours.
	 */
	let { stage }: { stage: TreeStage } = $props();

	const GROUND = 140;
	/** 0 for the first big tree, approaching 1 for an old one. */
	const growth = $derived(Math.min(1, stage.age > 0 ? (stage.age - 1) / 8 : 0));
	const trunk = $derived({ width: 8 + growth * 10, height: 46 + growth * 22 });
	const crown = $derived(30 + growth * 16);
	/** The crown's leaf clusters around its centre, more of them on an older tree. */
	const clusters = $derived.by(() => {
		const top = GROUND - trunk.height - crown * 0.55;
		const count = 5 + Math.min(4, stage.age - 1);
		return Array.from({ length: count }, (_, i) => {
			const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
			return { x: 100 + Math.cos(angle) * crown * 0.62, y: top + Math.sin(angle) * crown * 0.48, r: crown * 0.5 };
		});
	});
</script>

<svg viewBox="0 0 200 160" role="img" aria-hidden="true" class="tree">
	<ellipse class="soil" cx="100" cy={GROUND + 4} rx="70" ry="9" />

	{#if stage.kind === 'seed'}
		<ellipse class="seed" cx="100" cy={GROUND - 3} rx="9" ry="6" transform="rotate(-18 100 {GROUND - 3})" />
		<path class="sprout" d="M101 {GROUND - 8} q3 -6 8 -7" />
	{:else if stage.kind === 'seedling'}
		<path class="stem" d="M100 {GROUND} C100 {GROUND - 14} 98 {GROUND - 26} 100 {GROUND - 38}" />
		<path class="leaf" d="M100 {GROUND - 30} C88 {GROUND - 44} 72 {GROUND - 40} 70 {GROUND - 30} C82 {GROUND - 24} 94 {GROUND - 24} 100 {GROUND - 30}Z" />
		<path class="leaf light" d="M100 {GROUND - 36} C110 {GROUND - 54} 128 {GROUND - 52} 132 {GROUND - 42} C120 {GROUND - 34} 106 {GROUND - 32} 100 {GROUND - 36}Z" />
	{:else if stage.kind === 'sapling'}
		<path class="bark" d="M97 {GROUND} L98 {GROUND - 50} L102 {GROUND - 50} L103 {GROUND}Z" />
		<path class="stem" d="M100 {GROUND - 34} l-12 -12 M100 {GROUND - 42} l10 -10" />
		<circle class="leaf" cx="100" cy={GROUND - 66} r="22" />
		<circle class="leaf light" cx="88" cy={GROUND - 58} r="13" />
		<circle class="leaf light" cx="113" cy={GROUND - 72} r="11" />
	{:else}
		<path
			class="bark"
			d="M{100 - trunk.width / 2 - 4} {GROUND} Q{100 - trunk.width / 2} {GROUND - 10} {100 - trunk.width / 2 + 1} {GROUND - trunk.height} L{100 + trunk.width / 2 - 1} {GROUND - trunk.height} Q{100 + trunk.width / 2} {GROUND - 10} {100 + trunk.width / 2 + 4} {GROUND}Z"
		/>
		{#each clusters as cluster, i (i)}
			<circle class="leaf" class:light={i % 2 === 1} cx={cluster.x} cy={cluster.y} r={cluster.r} />
		{/each}
		<circle class="leaf light" cx="100" cy={GROUND - trunk.height - crown * 0.55} r={crown * 0.55} />
	{/if}
</svg>

<style>
	.tree {
		display: block;
		width: 100%;
		max-width: 220px;
		height: auto;
		overflow: visible;
	}

	.soil {
		fill: color-mix(in oklab, var(--warn) 30%, var(--surface));
	}

	.seed {
		fill: color-mix(in oklab, var(--warn) 70%, #3a2412);
	}

	.sprout,
	.stem {
		fill: none;
		stroke: var(--ok);
		stroke-width: 3;
		stroke-linecap: round;
	}

	.bark {
		fill: color-mix(in oklab, var(--warn) 55%, #3a2412);
	}

	.leaf {
		fill: var(--ok);
	}

	.leaf.light {
		fill: color-mix(in oklab, var(--ok) 72%, #d8f0c0);
	}
</style>
