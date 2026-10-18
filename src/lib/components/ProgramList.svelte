<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import type { ProgramItem } from '#lib/server/library.ts';
	import Icon from './Icon.svelte';

	let { items }: { items: ProgramItem[] } = $props();
	// Numbers are shown only when the programme has them; old programmes often don't.
	const numbered = $derived(items.some((item) => item.position !== undefined));
</script>

<ol class="program">
	{#each items as item, i (i)}
		<li>
			<svelte:element
				this={item.pieceId ? 'a' : 'div'}
				class="item"
				href={item.pieceId ? `/stuecke/${encodeURIComponent(item.pieceId)}` : undefined}
			>
				{#if numbered}<span class="number">{item.position ?? ''}</span>{/if}
				<span class="body">
					<span class="title">{item.title}</span>
					{#if item.subtitle || item.notes || item.status === 'none'}
						<span class="meta">
							{#if item.subtitle}<span>{item.subtitle}</span>{/if}
							{#if item.status === 'none'}<span class="tag">{t.concert.notInArchive}</span>{/if}
							{#if item.notes}<span class="note">{item.notes}</span>{/if}
						</span>
					{/if}
				</span>
				{#if item.pieceId}<span class="chevron"><Icon name="chevron" size={18} /></span>{/if}
			</svelte:element>
		</li>
	{/each}
</ol>

<style>
	.program {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		overflow: hidden;
	}

	li + li {
		border-top: 1px solid var(--border);
	}

	.item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 56px;
		padding: var(--space-3) var(--space-4);
		transition: background 0.12s;
	}

	a.item:hover {
		background: var(--surface-2);
	}

	.number {
		flex: none;
		width: 1.75rem;
		color: var(--accent);
		font-family: var(--font-serif);
		font-size: 1.125rem;
		font-weight: 700;
		text-align: right;
	}

	.body {
		display: grid;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.title {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.tag {
		padding: 0 var(--space-2);
		border-radius: 999px;
		background: var(--surface-2);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.note {
		font-style: italic;
	}

	.chevron {
		display: grid;
		flex: none;
		color: var(--text-muted);
		transition: transform 0.15s;
	}

	a.item:hover .chevron {
		transform: translateX(2px);
		color: var(--accent);
	}
</style>
