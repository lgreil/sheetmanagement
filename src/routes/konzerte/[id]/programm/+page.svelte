<script lang="ts">
	import { enhance } from '$app/forms';
	import { flip } from 'svelte/animate';
	import { t } from '#lib/i18n/index.ts';
	import { searchText } from '#lib/music/text.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();

	interface Entry {
		key: number;
		piece: string;
		title: string;
		subtitle?: string;
		notes: string;
	}

	let nextKey = 0;
	// The editor's working copy; the page data is only the starting point.
	// svelte-ignore state_referenced_locally
	let entries = $state<Entry[]>(data.state === 'ready' ? data.entries.map((entry) => ({ ...entry, key: nextKey++ })) : []);
	let query = $state('');
	let saving = $state(false);
	let dragged = $state<number | null>(null);

	const matches = $derived.by(() => {
		if (data.state !== 'ready') return [];
		const words = searchText(query).split(/\s+/).filter(Boolean);
		if (!words.length) return [];
		return data.pieces.filter((piece) => words.every((word) => piece.search.includes(word))).slice(0, 8);
	});

	function add(piece: { name: string; title: string; subtitle?: string }) {
		entries.push({ key: nextKey++, piece: piece.name, title: piece.title, subtitle: piece.subtitle, notes: '' });
		query = '';
	}

	function move(from: number, to: number) {
		if (to < 0 || to >= entries.length || from === to) return;
		const [entry] = entries.splice(from, 1);
		entries.splice(to, 0, entry);
	}

	const payload = $derived(JSON.stringify(entries.map(({ piece, notes }) => ({ piece, notes }))));
</script>

<Title title={t.editor.edit} />

<a class="back" href="/konzerte/{encodeURIComponent(data.concert.id)}"><Icon name="back" size={18} />{data.concert.title}</a>

<header class="head">
	<h1>{t.editor.title(data.concert.title)}</h1>
	<p>{t.editor.lead}</p>
</header>

{#if data.state !== 'ready'}
	<p class="notice">{t.editor.notInSheet}</p>
{:else}
	{#if form?.message}<p class="message" role="alert">{form.message}</p>{/if}

	<div class="search">
		<label class="field">
			<Icon name="search" size={18} />
			<input
				bind:value={query}
				type="search"
				placeholder={t.editor.search}
				aria-label={t.editor.search}
				autocomplete="off"
				spellcheck="false"
				onkeydown={(event) => {
					if (event.key === 'Enter' && matches[0]) {
						event.preventDefault();
						add(matches[0]);
					}
				}}
			/>
		</label>
		{#if query}
			<ul class="results">
				{#each matches as piece (piece.name)}
					<li>
						<button type="button" onclick={() => add(piece)}>
							<Icon name="plus" size={16} />
							<span>
								<strong>{piece.title}</strong>
								{#if piece.subtitle}<span class="muted">{piece.subtitle}</span>{/if}
							</span>
						</button>
					</li>
				{:else}
					<li class="none">{t.editor.noResults}</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if entries.length}
		<ol class="entries">
			{#each entries as entry, i (entry.key)}
				<li
					animate:flip={{ duration: 180 }}
					class:dragging={dragged === i}
					ondragover={(event) => {
						event.preventDefault();
						if (dragged !== null && dragged !== i) {
							move(dragged, i);
							dragged = i;
						}
					}}
					ondrop={(event) => event.preventDefault()}
				>
					<span
						class="handle"
						draggable="true"
						role="button"
						tabindex="-1"
						aria-hidden="true"
						ondragstart={(event) => {
							dragged = i;
							event.dataTransfer?.setData('text/plain', String(i));
						}}
						ondragend={() => (dragged = null)}
					>
						<Icon name="grip" size={18} />
					</span>
					<span class="number">{i + 1}</span>
					<span class="body">
						<strong>{entry.title}</strong>
						{#if entry.subtitle}<span class="muted">{entry.subtitle}</span>{/if}
						<input
							class="note"
							bind:value={entry.notes}
							placeholder={t.editor.notePlaceholder}
							aria-label="{t.editor.noteLabel}: {entry.title}"
							maxlength="300"
						/>
					</span>
					<span class="actions">
						<button type="button" onclick={() => move(i, i - 1)} disabled={i === 0} title={t.editor.up} aria-label={t.editor.up}>
							<Icon name="up" size={18} />
						</button>
						<button
							type="button"
							onclick={() => move(i, i + 1)}
							disabled={i === entries.length - 1}
							title={t.editor.down}
							aria-label={t.editor.down}
						>
							<Icon name="down" size={18} />
						</button>
						<button type="button" class="remove" onclick={() => entries.splice(i, 1)} title={t.editor.remove} aria-label={t.editor.remove}>
							<Icon name="trash" size={16} />
						</button>
					</span>
				</li>
			{/each}
		</ol>
	{:else}
		<p class="notice">{t.editor.empty}</p>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update({ reset: false });
				saving = false;
			};
		}}
	>
		<input type="hidden" name="entries" value={payload} />
		<input type="hidden" name="version" value={data.version} />
		<button class="button" disabled={saving}><Icon name="check" size={16} />{t.editor.save}</button>
		<a class="cancel" href="/konzerte/{encodeURIComponent(data.concert.id)}">{t.editor.cancel}</a>
	</form>
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		margin-bottom: var(--space-4);
		color: var(--text-muted);
		font-weight: 500;
	}

	.head {
		display: grid;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.head p,
	.muted {
		color: var(--text-muted);
	}

	.muted {
		font-size: 0.875rem;
	}

	.search {
		position: relative;
		margin-bottom: var(--space-4);
	}

	.field {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		height: 48px;
		padding: 0 var(--space-4);
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text-muted);
	}

	.field:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 4px var(--accent-soft);
	}

	.field input {
		flex: 1;
		min-width: 0;
		height: 100%;
		border: 0;
		outline: 0;
		background: none;
		color: var(--text);
		font: inherit;
	}

	.results {
		position: absolute;
		z-index: 5;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		margin: 0;
		padding: var(--space-1);
		list-style: none;
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.results button {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 0;
		border-radius: 10px;
		background: none;
		color: var(--text);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.results button:hover,
	.results button:focus-visible {
		background: var(--surface-2);
	}

	.results button span {
		display: grid;
	}

	.none {
		padding: var(--space-3);
		color: var(--text-muted);
	}

	.entries {
		margin: 0 0 var(--space-4);
		padding: 0;
		list-style: none;
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.entries li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--surface);
	}

	.entries li + li {
		border-top: 1px solid var(--border);
	}

	.entries li.dragging {
		opacity: 0.5;
	}

	.handle {
		display: grid;
		color: var(--text-muted);
		cursor: grab;
	}

	.number {
		width: 1.5rem;
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

	.body strong {
		overflow-wrap: anywhere;
	}

	.note {
		max-width: 320px;
		height: 32px;
		margin-top: var(--space-1);
		padding: 0 var(--space-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg);
		color: var(--text);
		font: inherit;
		font-size: 0.875rem;
	}

	.actions {
		display: flex;
		flex: none;
	}

	.actions button {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border: 0;
		border-radius: 999px;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}

	.actions button:hover:not(:disabled) {
		background: var(--surface-2);
		color: var(--text);
	}

	.actions button:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.actions .remove:hover:not(:disabled) {
		background: color-mix(in oklab, var(--danger) 12%, transparent);
		color: var(--danger);
	}

	form {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-5);
		border: 0;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-contrast);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.button:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.cancel {
		color: var(--text-muted);
		font-weight: 500;
	}

	.notice,
	.message {
		margin-bottom: var(--space-4);
		padding: var(--space-4);
		border-radius: var(--radius-m);
	}

	.notice {
		border: 1px dashed var(--border);
		color: var(--text-muted);
	}

	.message {
		background: color-mix(in oklab, var(--danger) 10%, transparent);
	}

	@media (max-width: 560px) {
		.handle {
			display: none;
		}
	}
</style>
