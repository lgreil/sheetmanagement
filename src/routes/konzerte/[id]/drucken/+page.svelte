<script lang="ts">
	import { page } from '$app/state';
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data } = $props();
	const concertUrl = $derived(`/konzerte/${encodeURIComponent(data.concert.id)}`);
	const when = $derived([data.concert.date, data.concert.time].filter(Boolean).join(', '));
</script>

<Title title={t.print.title(data.concert.title)} />

<div class="no-print controls">
	<a class="back" href={concertUrl}><Icon name="back" size={18} />{t.print.back}</a>
	<div class="tabs" role="tablist">
		<a role="tab" class="tab" class:active={data.kind === 'handout'} aria-selected={data.kind === 'handout'} href="?art=zettel" data-sveltekit-replacestate>
			{t.print.handout}
		</a>
		<a role="tab" class="tab" class:active={data.kind === 'setlist'} aria-selected={data.kind === 'setlist'} href="?art=setlist" data-sveltekit-replacestate>
			{t.print.setlist}
		</a>
	</div>
	<p class="hint">{data.kind === 'setlist' ? t.print.setlistHint : t.print.handoutHint}</p>
	<button class="btn" onclick={() => window.print()} disabled={!data.items.length}><Icon name="file" size={16} />{t.print.print}</button>
</div>

{#if !data.items.length}
	<p class="msg info no-print">{t.print.empty}</p>
{:else if data.kind === 'handout'}
	<article class="sheet handout">
		<header>
			<p class="orchestra">{page.data.orchestraName}</p>
			<h1>{data.concert.title}</h1>
			{#if when || data.concert.location}
				<p class="when">{[when, data.concert.location].filter(Boolean).join(' · ')}</p>
			{/if}
		</header>
		<h2>{t.print.program}</h2>
		<ol>
			{#each data.items as item, i (i)}
				<li>
					<span class="piece">{item.title}</span>
					{#if item.subtitle}<span class="composer">{item.subtitle}</span>{/if}
					{#if item.notes}<span class="note">{item.notes}</span>{/if}
				</li>
			{/each}
		</ol>
	</article>
{:else}
	<article class="sheet setlist">
		<p class="setlist-head">{data.concert.title}{when ? ` · ${when}` : ''}</p>
		<ol>
			{#each data.items as item, i (i)}
				<li>
					<span class="number">{i + 1}</span>
					<span class="piece">{item.title}</span>
					{#if item.notes}<span class="note">{item.notes}</span>{/if}
				</li>
			{/each}
		</ol>
	</article>
{/if}

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}

	.back {
		display: inline-flex;
		flex-basis: 100%;
		align-items: center;
		gap: var(--space-1);
		color: var(--text-muted);
		font-weight: 500;
	}

	.tabs {
		display: flex;
		gap: var(--space-2);
	}

	.tab {
		padding: 6px 14px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.tab.active {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.hint {
		flex: 1;
		min-width: 200px;
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	/* The page as it will print, so what you see is what you get. */
	.sheet {
		max-width: 720px;
		margin: 0 auto;
		padding: var(--space-6);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.handout header {
		margin-bottom: var(--space-6);
		text-align: center;
	}

	.orchestra {
		color: var(--text-muted);
		font-size: 0.875rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.handout h1 {
		margin: var(--space-2) 0;
	}

	.when {
		color: var(--text-muted);
	}

	.handout h2 {
		margin-bottom: var(--space-3);
		color: var(--text-muted);
		font-size: 0.8125rem;
		letter-spacing: 0.12em;
		text-align: center;
		text-transform: uppercase;
	}

	ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.handout li {
		display: grid;
		gap: 2px;
		padding: var(--space-3) 0;
		border-bottom: 1px dotted var(--border);
		text-align: center;
		break-inside: avoid;
	}

	.handout li:last-child {
		border-bottom: 0;
	}

	.handout .piece {
		font-family: var(--font-serif);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.composer {
		color: var(--text-muted);
	}

	.note {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-style: italic;
	}

	.setlist-head {
		margin-bottom: var(--space-4);
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.setlist li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-1) var(--space-4);
		padding: var(--space-2) 0;
		border-bottom: 2px solid var(--border);
		break-inside: avoid;
	}

	.number {
		min-width: 2ch;
		font-size: 1.75rem;
		font-weight: 800;
		text-align: right;
	}

	.setlist .piece {
		flex: 1;
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.setlist .note {
		flex-basis: 100%;
		padding-left: calc(2ch + var(--space-4));
		font-size: 1rem;
	}

	@media print {
		.sheet {
			max-width: none;
			padding: 0;
			border: 0;
		}

		.setlist .piece,
		.number {
			font-size: 22pt;
		}
	}
</style>
