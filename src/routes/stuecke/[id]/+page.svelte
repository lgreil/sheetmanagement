<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import ConcertRow from '#lib/components/ConcertRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data } = $props();
	const piece = $derived(data.piece);
	type Part = (typeof data.piece.parts)[number];

	const GROUP_ORDER = [
		'featured',
		'holz',
		'blech',
		'schlagwerk',
		'tasten',
		'gesang',
		'sonstige',
		'streicher',
		'other'
	] as const;
	type GroupKey = (typeof GROUP_ORDER)[number];

	const groupOf = (part: Part): GroupKey => {
		if (part.kind === 'partitur' || part.kind === 'solo') return 'featured';
		if (part.kind === 'audio' || part.kind === 'sonstiges' || !part.family || part.family === 'partitur') return 'other';
		return part.family;
	};

	const groups = $derived(
		GROUP_ORDER.map((key) => ({ key, parts: piece.parts.filter((part) => groupOf(part) === key) })).filter(
			(group) => group.parts.length > 0
		)
	);

	const info = $derived(
		(Object.keys(t.piece.info) as (keyof typeof t.piece.info)[])
			.map((key) => ({ key, label: t.piece.info[key], value: piece.info[key] }))
			.filter((item) => item.value)
	);

	const gaps = $derived(
		piece.parts.filter((part) => part.status !== 'ok' && part.kind !== 'sonstiges' && part.kind !== 'audio').length
	);
</script>

<Title title={piece.title} />

<a class="back" href="/stuecke"><Icon name="back" size={18} />{t.piece.back}</a>

<header class="head">
	{#if piece.composer || piece.catalogue}
		<p class="eyebrow">{[piece.composer, piece.catalogue].filter(Boolean).join(' · ')}</p>
	{/if}
	<h1>{piece.title}</h1>
	<div class="facts">
		{#if piece.status === 'none'}
			<span>{t.pieces.status.none}</span>
		{:else}
			<span>{t.pieces.parts(piece.partCount)}</span>
		{/if}
		{#if piece.category}<span class="tag">{piece.category}</span>{/if}
		{#if piece.folderUrl}
			<a class="drive" href={piece.folderUrl} target="_blank" rel="noopener noreferrer">
				<Icon name="folder" size={16} />
				{t.piece.openFolder}
			</a>
		{/if}
	</div>
	{#if gaps > 0}
		<p class="gaps"><Icon name="alert" size={16} />{t.piece.missingSummary(gaps)}</p>
	{/if}
</header>

{#if piece.status === 'none'}
	<p class="no-music">{t.piece.noMusic}</p>
{/if}

{#if info.length}
	<dl class="info">
		{#each info as item (item.key)}
			<div class:wide={item.key === 'notes'}>
				<dt>{item.label}</dt>
				<dd>{item.value}</dd>
			</div>
		{/each}
	</dl>
{/if}

{#each groups as group (group.key)}
	<section class="group">
		<h2>{t.piece.groups[group.key]}</h2>
		<ul class="parts">
			{#each group.parts as part (part.id)}
				<li>
					<a
						class="part"
						class:missing={part.status === 'missing'}
						href={part.url}
						target="_blank"
						rel="noopener noreferrer"
						title={part.fileName}
					>
						<span class="icon">
							<Icon name={part.kind === 'audio' ? 'headphones' : 'file'} size={18} />
						</span>
						<span class="label">
							<span class="name">{part.label}</span>
							{#if part.notes.length || part.subfolder}
								<span class="notes">
									{#each part.notes as note (note)}<span class="note">{note}</span>{/each}
									{#if part.subfolder}<span class="note">{part.subfolder}</span>{/if}
								</span>
							{/if}
						</span>
						{#if part.status !== 'ok'}
							<span class="status {part.status}">{t.piece.partStatus[part.status]}</span>
						{/if}
						<span class="open"><Icon name="external" size={16} /></span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/each}

<section class="played">
	<h2>{t.piece.playedAt}</h2>
	{#if data.playedAt.length}
		<ul class="concerts">
			{#each data.playedAt as concert (concert.id)}
				<li><ConcertRow {concert} /></li>
			{/each}
		</ul>
	{:else}
		<p class="placeholder">{data.sheet === 'ok' ? t.piece.playedAtNone : t.piece.playedAtNoSheet}</p>
	{/if}
</section>

{#if piece.parts.length}<p class="hint">{t.piece.driveHint}</p>{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		margin-bottom: var(--space-4);
		color: var(--text-muted);
		font-weight: 500;
	}

	.back:hover {
		color: var(--accent);
	}

	.head {
		display: grid;
		gap: var(--space-2);
		margin-bottom: var(--space-5);
	}

	.eyebrow {
		color: var(--accent);
		font-weight: 600;
	}

	.facts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		color: var(--text-muted);
	}

	.tag {
		padding: 1px var(--space-2);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.drive {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 6px 14px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font-size: 0.875rem;
		font-weight: 500;
		transition: border-color 0.15s;
	}

	.drive:hover {
		border-color: var(--accent);
	}

	.gaps {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--warn);
		font-size: 0.9375rem;
	}

	.group {
		margin-bottom: var(--space-5);
	}

	.group h2,
	.played h2 {
		margin: 0 0 var(--space-2) var(--space-1);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.parts {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.part {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 56px;
		height: 100%;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		transition:
			border-color 0.15s,
			box-shadow 0.15s,
			transform 0.15s;
	}

	.part:hover {
		border-color: color-mix(in oklab, var(--accent) 45%, var(--border));
		box-shadow: var(--shadow);
		transform: translateY(-1px);
	}

	.part.missing {
		border-style: dashed;
		background: transparent;
		color: var(--text-muted);
	}

	.icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: var(--accent-soft);
		color: var(--accent);
	}

	.part.missing .icon {
		background: var(--surface-2);
		color: var(--text-muted);
	}

	.label {
		display: grid;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.name {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.notes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.note {
		padding: 0 6px;
		border-radius: 6px;
		background: var(--surface-2);
		color: var(--text-muted);
		font-size: 0.75rem;
	}

	.status {
		flex: none;
		padding: 1px var(--space-2);
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--warn);
		background: color-mix(in oklab, var(--warn) 14%, transparent);
	}

	.status.missing {
		color: var(--danger);
		background: color-mix(in oklab, var(--danger) 12%, transparent);
	}

	.open {
		display: grid;
		flex: none;
		color: var(--text-muted);
	}

	.part:hover .open {
		color: var(--accent);
	}

	.no-music {
		margin-bottom: var(--space-5);
		padding: var(--space-4);
		border: 1px dashed var(--border);
		border-radius: var(--radius-m);
		color: var(--text-muted);
	}

	.info {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: var(--space-3);
		margin: 0 0 var(--space-5);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.info .wide {
		grid-column: 1 / -1;
	}

	.info dt {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.info dd {
		margin: 0;
		white-space: pre-line;
		overflow-wrap: anywhere;
	}

	.played {
		margin-top: var(--space-6);
	}

	.concerts {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		overflow: hidden;
	}

	.concerts li + li {
		border-top: 1px solid var(--border);
	}

	.placeholder {
		padding: var(--space-4);
		border: 1px dashed var(--border);
		border-radius: var(--radius-m);
	}

	.played p,
	.hint {
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.hint {
		margin-top: var(--space-4);
		font-size: 0.8125rem;
	}
</style>
