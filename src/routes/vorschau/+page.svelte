<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Segmented from '#lib/components/Segmented.svelte';
	import Title from '#lib/components/Title.svelte';
	import { ICON_CANDIDATES } from '#lib/preview/icon-candidates.ts';

	/**
	 * Comparison page for the new look (#155 icons, #163 fonts): every candidate side by side,
	 * in the app's own colours, to decide on a phone. Temporary, so its texts aren't in de.ts;
	 * it goes away with the candidate fonts once both are decided.
	 */
	let { data } = $props();

	const headings = [
		{ name: 'Heute', family: 'var(--font-serif)', weight: 600, note: 'Systemschrift mit Serifen' },
		{ name: 'Barlow Condensed', family: "'Barlow Condensed'", weight: 700, note: 'Favorit: schmal, kräftig, ruhig' },
		{ name: 'Oswald', family: "'Oswald'", weight: 700, note: 'Am nächsten an den Storys' },
		{ name: 'Big Shoulders', family: "'Big Shoulders Display'", weight: 800, note: 'Die mutigste' }
	];

	type Body = 'system' | 'barlow' | 'atkinson';
	const bodies: Record<Body, string> = {
		system: 'var(--font)',
		barlow: "'Barlow', var(--font)",
		atkinson: "'Atkinson Hyperlegible Next', var(--font)"
	};
	let body = $state<Body>('barlow');

	// The Bachkreis logo and gold, as in the stories, or this orchestra's own (the demo's differ).
	const own = $derived(data.logo !== '/logo.png');
	let logoChoice = $state<'own' | 'bachkreis'>('bachkreis');
	const logo = $derived(logoChoice === 'bachkreis' ? '/logo.png' : data.logo);

	const phosphor = (markup: string) =>
		`<svg viewBox="0 0 256 256" width="24" height="24" fill="currentColor" aria-hidden="true">${markup}</svg>`;
	const tabler = (markup: string) =>
		`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${markup}</svg>`;

	const sets = [
		{ name: 'Heute', render: null },
		{ name: 'Phosphor', render: (i: (typeof ICON_CANDIDATES)[number]) => phosphor(i.regular) },
		{ name: 'Phosphor Duotone', render: (i: (typeof ICON_CANDIDATES)[number]) => phosphor(i.duotone) },
		{ name: 'Tabler', render: (i: (typeof ICON_CANDIDATES)[number]) => tabler(i.outline) }
	];
	const sample = ['home', 'parts', 'music', 'calendar', 'users'].map((name) => ICON_CANDIDATES.find((i) => i.name === name)!);
	const sampleLabels: Record<string, string> = { home: 'Übersicht', parts: 'Meine Noten', music: 'Archiv', calendar: 'Konzerte', users: 'Anwesenheit' };
</script>

<Title title="Neuer Look" />
<PageHeader
	title="Neuer Look: Vorschau"
	lead="Schriften und Icons zur Auswahl, in euren Farben. Oben rechts zwischen Hell und Dunkel wechseln, am besten am Handy anschauen."
/>

<section class="block" style:--body={bodies[body]}>
	<h2>Schriften (#163)</h2>
	<div class="controls">
		<Segmented
			label="Schrift für Text"
			bind:value={body}
			options={[
				{ value: 'system', label: 'Text: heute' },
				{ value: 'barlow', label: 'Barlow' },
				{ value: 'atkinson', label: 'Atkinson' }
			]}
		/>
		{#if own}
			<Segmented
				label="Logo im Hintergrund"
				bind:value={logoChoice}
				options={[
					{ value: 'bachkreis', label: 'Bachkreis' },
					{ value: 'own', label: 'Dieses Orchester' }
				]}
			/>
		{/if}
	</div>

	<div class="fonts">
		{#each headings as heading (heading.name)}
			<article
				class="font-card"
				style:--heading={heading.family}
				style:--heading-weight={heading.weight}
				style:--story-ink={own && logoChoice === 'bachkreis' ? '#e6b422' : 'var(--brand)'}
			>
				<div class="story">
					<img class="watermark" src={logo} alt="" />
					<p class="story-title">Probenplan</p>
					<p class="story-sub">Herbstkonzert 2026</p>
				</div>
				<div class="sample">
					<p class="eyebrow">Nächste Probe · Sa 14.11.</p>
					<p class="sample-title">Egmont-Ouvertüre</p>
					<p class="sample-text">
						Takt 1–120 mit allen, danach Streicher ab Buchstabe B. Bitte die Sprünge aus der letzten Probe eintragen.
					</p>
					<p class="big"><span>34</span> Zusagen</p>
				</div>
				<p class="font-name"><strong>{heading.name}</strong> · {heading.note}</p>
			</article>
		{/each}
	</div>
</section>

<section class="block">
	<h2>Icons (#155)</h2>

	<div class="in-use">
		{#each sets as set (set.name)}
			<div class="nav-sample">
				<p class="set-name">{set.name}</p>
				<ul>
					{#each sample as icon (icon.name)}
						<li>
							{#if set.render}{@html set.render(icon)}{:else}<Icon name={icon.name} size={22} />{/if}
							<span>{sampleLabels[icon.name]}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th scope="col">Bedeutung</th>
					{#each sets as set (set.name)}<th scope="col">{set.name}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each ICON_CANDIDATES as icon (icon.name)}
					<tr>
						<th scope="row">{icon.name}</th>
						{#each sets as set (set.name)}
							<td>{#if set.render}{@html set.render(icon)}{:else}<Icon name={icon.name} size={22} />{/if}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	@font-face {
		font-family: 'Barlow Condensed';
		font-weight: 600;
		font-display: swap;
		src: url('/vorschau-fonts/barlow-condensed-latin-600-normal.woff2') format('woff2');
	}
	@font-face {
		font-family: 'Barlow Condensed';
		font-weight: 700;
		font-display: swap;
		src: url('/vorschau-fonts/barlow-condensed-latin-700-normal.woff2') format('woff2');
	}
	@font-face {
		font-family: 'Barlow';
		font-weight: 400;
		font-display: swap;
		src: url('/vorschau-fonts/barlow-latin-400-normal.woff2') format('woff2');
	}
	@font-face {
		font-family: 'Barlow';
		font-weight: 600;
		font-display: swap;
		src: url('/vorschau-fonts/barlow-latin-600-normal.woff2') format('woff2');
	}
	@font-face {
		font-family: 'Oswald';
		font-weight: 600;
		font-display: swap;
		src: url('/vorschau-fonts/oswald-latin-600-normal.woff2') format('woff2');
	}
	@font-face {
		font-family: 'Oswald';
		font-weight: 700;
		font-display: swap;
		src: url('/vorschau-fonts/oswald-latin-700-normal.woff2') format('woff2');
	}
	@font-face {
		font-family: 'Big Shoulders Display';
		font-weight: 800;
		font-display: swap;
		src: url('/vorschau-fonts/big-shoulders-display-latin-800-normal.woff2') format('woff2');
	}
	@font-face {
		font-family: 'Atkinson Hyperlegible Next';
		font-weight: 400;
		font-display: swap;
		src: url('/vorschau-fonts/atkinson-hyperlegible-next-latin-400-normal.woff2') format('woff2');
	}
	@font-face {
		font-family: 'Atkinson Hyperlegible Next';
		font-weight: 700;
		font-display: swap;
		src: url('/vorschau-fonts/atkinson-hyperlegible-next-latin-700-normal.woff2') format('woff2');
	}

	.block {
		display: grid;
		gap: var(--space-4);
		margin-bottom: var(--space-7);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.fonts {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr));
		gap: var(--space-4);
	}

	.font-card {
		display: grid;
		align-content: start;
		gap: var(--space-3);
		font-family: var(--body);
	}

	/* Like the Instagram stories: always dark, the logo large and dim behind gold type. */
	.story {
		position: relative;
		overflow: hidden;
		display: grid;
		place-content: center;
		gap: var(--space-1);
		aspect-ratio: 4 / 3;
		padding: var(--space-4);
		border-radius: var(--radius-m);
		background: #0b0b0a;
		text-align: center;
	}

	.watermark {
		position: absolute;
		inset: 50% auto auto 50%;
		width: 150%;
		height: auto;
		translate: -50% -50%;
		opacity: 0.22;
		pointer-events: none;
	}

	.story-title,
	.story-sub {
		position: relative;
		margin: 0;
		color: var(--story-ink);
	}

	.story-title {
		font-family: var(--heading);
		font-weight: var(--heading-weight);
		font-size: 2.5rem;
		line-height: 1;
	}

	.story-sub {
		font-size: 1.0625rem;
	}

	.sample {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.sample p {
		margin: 0;
	}

	.eyebrow {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.sample-title {
		font-family: var(--heading);
		font-weight: var(--heading-weight);
		font-size: 1.75rem;
		line-height: 1.1;
	}

	.sample-text {
		line-height: 1.5;
	}

	.big {
		color: var(--text-muted);
	}

	.big span {
		color: var(--accent);
		font-family: var(--heading);
		font-weight: var(--heading-weight);
		font-size: 2.25rem;
		line-height: 1;
	}

	.font-name {
		margin: 0;
		color: var(--text-muted);
		font-family: var(--font);
		font-size: 0.875rem;
	}

	.in-use {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr));
		gap: var(--space-4);
	}

	.nav-sample {
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.set-name {
		margin: 0 0 var(--space-2);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.nav-sample ul {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.nav-sample li {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.nav-sample li :global(svg) {
		color: var(--accent);
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--border);
		text-align: center;
	}

	thead th {
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	tbody th {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 400;
		text-align: left;
	}

	td :global(svg) {
		display: block;
		margin: auto;
	}

	/* All five columns on a phone, without scrolling sideways. */
	@media (max-width: 480px) {
		th,
		td {
			padding: var(--space-2) var(--space-1);
		}

		thead th {
			font-size: 0.6875rem;
			hyphens: auto;
		}

		tbody th {
			font-size: 0.75rem;
		}
	}
</style>
