<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { t } from '#lib/i18n/index.ts';
	import { searchText } from '#lib/music/text.ts';
	import type { PieceSummary } from '#lib/music/types.ts';
	import AddToArchive from '#lib/components/AddToArchive.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();

	const NEEDS_WORK = '__needs-work';
	const NO_MUSIC = '__no-music';
	let query = $state('');
	let filter = $state('');
	let input: HTMLInputElement | undefined = $state();

	// Keep search and filter when coming back from a piece.
	export const snapshot = {
		capture: () => ({ query, filter }),
		restore: (value: { query: string; filter: string }) => ({ query, filter } = value)
	};

	// Programmes first ("A-Orchester", "Ehemaligenorchester"), then categories like "Weihnachtsstücke".
	const filters = $derived([
		{ value: '', label: t.pieces.all },
		...data.programs.map((program) => ({ value: `program:${program}`, label: program })),
		...data.categories.map((category) => ({ value: `category:${category}`, label: category })),
		{ value: NEEDS_WORK, label: t.pieces.needsWork },
		...(data.pieces.some((piece) => piece.status === 'none') ? [{ value: NO_MUSIC, label: t.pieces.noMusic }] : [])
	]);

	// "/stuecke?komponist=Bach", linked from a piece page: all works by one composer.
	const composer = $derived(page.url.searchParams.get('komponist')?.trim() || null);
	const activeCategory = $derived(filter.startsWith('category:') ? filter.slice('category:'.length) : null);

	const visible = $derived.by(() => {
		const words = searchText(query).split(/\s+/).filter(Boolean);
		const byComposer = composer ? searchText(composer) : null;
		return data.pieces.filter((piece) => {
			if (byComposer && searchText(piece.composer) !== byComposer) return false;
			if (filter === NEEDS_WORK && (piece.status === 'ok' || piece.status === 'none')) return false;
			if (filter === NO_MUSIC && piece.status !== 'none') return false;
			if (filter.startsWith('program:') && !piece.programs.includes(filter.slice('program:'.length))) return false;
			if (filter.startsWith('category:') && piece.category !== filter.slice('category:'.length)) return false;
			return words.every((word) => piece.search.includes(word));
		});
	});

	const letterOf = (title: string) => {
		const first = searchText(title.charAt(0)).toUpperCase();
		return /[A-Z]/.test(first) ? first : '#';
	};

	const groups = $derived.by(() => {
		const result: { letter: string; pieces: PieceSummary[] }[] = [];
		for (const piece of visible) {
			const letter = letterOf(piece.title);
			if (result.at(-1)?.letter !== letter) result.push({ letter, pieces: [] });
			result.at(-1)!.pieces.push(piece);
		}
		return result;
	});

	onMount(() => {
		// "/" jumps to the search field, like on many sites.
		const onKey = (event: KeyboardEvent) => {
			if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
				event.preventDefault();
				input?.focus();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<Title title={t.pieces.title} />
<PageHeader title={t.pieces.title} lead={t.pieces.lead} />

{#if data.error === 'not-configured'}
	<EmptyState icon="music" text={t.pieces.empty} />
{:else if data.error}
	<div class="notice">
		<p>{t.pieces.failed}</p>
		<a href="/status">{t.pieces.checkStatus}</a>
	</div>
{:else}
	<div class="tools">
		<label class="search">
			<Icon name="search" size={18} />
			<input
				bind:this={input}
				bind:value={query}
				type="search"
				placeholder={t.pieces.search}
				aria-label={t.pieces.search}
				autocomplete="off"
				spellcheck="false"
			/>
			{#if query}
				<button class="clear" onclick={() => (query = '')} aria-label="Suche leeren">
					<Icon name="x" size={16} />
				</button>
			{/if}
		</label>

		{#if composer}
			<a class="composer" href="/stuecke" aria-label={t.pieces.clearComposer} title={t.pieces.clearComposer}>
				{t.pieces.byComposer(composer)}
				<Icon name="x" size={14} />
			</a>
		{/if}

		<div class="chips" role="radiogroup" aria-label="Filter">
			{#each filters as option (option.value)}
				<button
					class="chip"
					class:active={filter === option.value}
					role="radio"
					aria-checked={filter === option.value}
					onclick={() => (filter = option.value)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	{#if activeCategory && data.categoryFiles[activeCategory]?.length}
		<div class="category-files">
			<span class="label">{t.pieces.categoryFiles}</span>
			{#each data.categoryFiles[activeCategory] as file (file.id)}
				<a href={file.url} target="_blank" rel="noopener noreferrer"><Icon name="file" size={16} />{file.name}</a>
			{/each}
		</div>
	{/if}

	<p class="count" aria-live="polite">
		{t.pieces.count(visible.length)}
		{#if filter === NEEDS_WORK}· <a class="gaps-link" href="/fehlende-stimmen">{t.gaps.link} →</a>{/if}
	</p>

	{#if visible.length === 0}
		<p class="none">{t.pieces.noResults}</p>
	{:else}
		{#each groups as group (group.letter)}
			<section class="group">
				<h2 class="letter">{group.letter}</h2>
				<ul class="list">
					{#each group.pieces as piece (piece.id)}
						<li>
							<a class="row" href="/stuecke/{piece.id}">
								<span class="main">
									<span class="title">{piece.title}</span>
									{#if piece.composer || piece.catalogue || piece.category || piece.programs.length}
										<span class="meta">
											{[piece.composer, piece.catalogue].filter(Boolean).join(' · ')}
											{#each piece.programs as program (program)}<span class="tag program">{program}</span>{/each}
											{#if piece.category}<span class="tag">{piece.category}</span>{/if}
										</span>
									{/if}
								</span>
								<span class="side">
									{#if piece.status !== 'ok'}
										<span class="status {piece.status}">{t.pieces.status[piece.status]}</span>
									{/if}
									{#if piece.status !== 'none'}<span class="parts">{t.pieces.parts(piece.partCount)}</span>{/if}
									<span class="chevron"><Icon name="chevron" size={18} /></span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{/if}
{/if}

{#if data.canAdd}
	<AddToArchive kind="piece" result={form} />
{/if}

<style>
	.gaps-link {
		color: var(--accent);
		font-weight: 600;
	}

	.tools {
		position: sticky;
		top: var(--header-height);
		z-index: 5;
		display: grid;
		gap: var(--space-3);
		margin: 0 calc(-1 * var(--space-4));
		padding: var(--space-3) var(--space-4);
		background: color-mix(in oklab, var(--bg) 96%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid transparent;
	}

	.search {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		height: 48px;
		padding: 0 var(--space-3) 0 var(--space-4);
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text-muted);
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.search:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 4px var(--accent-soft);
	}

	.search input {
		flex: 1;
		min-width: 0;
		height: 100%;
		border: 0;
		outline: 0;
		background: none;
		color: var(--text);
		font: inherit;
		font-size: 1rem;
	}

	.search input::-webkit-search-cancel-button {
		display: none;
	}

	.clear {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--text-muted);
		cursor: pointer;
	}

	.chips {
		display: flex;
		gap: var(--space-2);
		overflow-x: auto;
		scrollbar-width: none;
		margin: 0 calc(-1 * var(--space-4));
		padding: 0 var(--space-4);
	}

	.chips::-webkit-scrollbar {
		display: none;
	}

	.chip {
		flex: none;
		padding: 6px 14px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text-muted);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
	}

	.chip:hover {
		color: var(--text);
	}

	.chip.active {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.composer {
		display: inline-flex;
		align-items: center;
		justify-self: start;
		gap: var(--space-2);
		padding: 6px 12px 6px 14px;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.composer:hover {
		background: color-mix(in oklab, var(--accent) 22%, transparent);
	}

	.category-files {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
		margin-top: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		font-size: 0.9375rem;
	}

	.category-files .label {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.category-files a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--accent);
		font-weight: 600;
	}

	.count {
		margin: var(--space-3) 0 var(--space-2);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.group {
		margin-top: var(--space-4);
	}

	.letter {
		margin: 0 0 var(--space-2) var(--space-1);
		color: var(--accent);
		font-family: var(--font-serif);
		font-size: 1.25rem;
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		overflow: hidden;
	}

	.list li + li {
		border-top: 1px solid var(--border);
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 60px;
		padding: var(--space-3) var(--space-4);
		transition: background 0.12s;
	}

	.row:hover {
		background: var(--surface-2);
	}

	.main {
		display: grid;
		gap: 2px;
		min-width: 0;
		flex: 1;
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
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 600;
	}

	/* Pieces in a current programme stand out. */
	.tag.program {
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.side {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex: none;
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.status {
		padding: 1px var(--space-2);
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--warn);
		background: color-mix(in oklab, var(--warn) 14%, transparent);
	}

	.status.none {
		color: var(--text-muted);
		background: var(--surface-2);
	}

	.status.missing {
		color: var(--danger);
		background: color-mix(in oklab, var(--danger) 12%, transparent);
	}

	.chevron {
		display: grid;
		transition: transform 0.15s;
	}

	.row:hover .chevron {
		transform: translateX(2px);
		color: var(--accent);
	}

	.none,
	.notice {
		padding: var(--space-6) var(--space-4);
		text-align: center;
		color: var(--text-muted);
	}

	.notice {
		display: grid;
		gap: var(--space-3);
		justify-items: center;
	}

	.notice a {
		color: var(--accent);
		font-weight: 600;
	}

	@media (max-width: 560px) {
		.parts {
			display: none;
		}

		.side {
			gap: var(--space-2);
		}
	}
</style>
