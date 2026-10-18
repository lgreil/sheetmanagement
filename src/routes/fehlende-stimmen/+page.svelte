<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data } = $props();

	/** "" = all pieces, "*" = any current programme, else one programme. */
	let filter = $state('');
	const shown = $derived(
		data.pieces.filter((piece) =>
			filter === '' ? true : filter === '*' ? piece.programs.length > 0 : piece.programs.includes(filter)
		)
	);
	const filters = $derived([
		{ key: '', label: t.gaps.all },
		...(data.programs.length ? [{ key: '*', label: t.gaps.current }] : []),
		...(data.programs.length > 1 ? data.programs.map((program) => ({ key: program, label: program })) : [])
	]);
</script>

<Title title={t.gaps.title} />
<PageHeader title={t.gaps.title} lead={t.gaps.lead} />

{#if !data.ok}
	<p class="msg error">{t.gaps.failed}</p>
{:else if !data.pieces.length}
	<p class="msg ok"><Icon name="check" size={16} />{t.gaps.none}</p>
{:else}
	<ul class="counts">
		{#each ['missing', 'empty', 'incomplete', 'reports'] as const as kind (kind)}
			{#if data.counts[kind]}
				<li class={kind}><strong>{data.counts[kind]}</strong> {t.gaps.counts[kind]}</li>
			{/if}
		{/each}
		{#if data.canManage}<li class="manage"><a href="/meldungen">{t.gaps.manage} →</a></li>{/if}
	</ul>

	{#if filters.length > 1}
		<div class="filters" role="tablist">
			{#each filters as option (option.key)}
				<button role="tab" class="filter" class:active={filter === option.key} aria-selected={filter === option.key} onclick={() => (filter = option.key)}>
					{option.label}
				</button>
			{/each}
		</div>
	{/if}

	{#if shown.length}
		<ul class="pieces">
			{#each shown as piece (piece.id)}
				<li class="piece">
					<div class="head">
						<a class="title" href="/stuecke/{encodeURIComponent(piece.id)}">{piece.title}</a>
						{#if piece.composer}<span class="muted">{piece.composer}</span>{/if}
						{#each piece.programs as program (program)}<span class="tag program">{program}</span>{/each}
					</div>
					<ul class="gaps">
						{#each piece.gaps as gap (gap.id)}
							<li>
								<a href={gap.url} target="_blank" rel="noopener noreferrer">{gap.label}</a>
								<span class="status {gap.status}">{t.piece.partStatus[gap.status]}</span>
								{#if gap.done}<span class="status done" title={t.gaps.doneHint}><Icon name="check" size={12} />{t.gaps.done}</span>{/if}
							</li>
						{/each}
						{#each piece.reports as report (report.id)}
							<li>
								<span>{report.part || t.reports.wholePiece}</span>
								<span class="status reported"><Icon name="flag" size={12} />{t.feedbackValues.reportKind[report.kind]}</span>
								{#if report.comment}<span class="muted">„{report.comment}“</span>{/if}
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="msg info">{t.gaps.noneHere}</p>
	{/if}
{/if}

<style>
	.msg {
		margin-bottom: var(--space-4);
	}

	.counts {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0 0 var(--space-4);
		padding: 0;
		list-style: none;
	}

	.counts li {
		padding: var(--space-1) var(--space-3);
		border-radius: 999px;
		background: var(--surface-2);
		font-size: 0.875rem;
	}

	.counts .missing,
	.counts .empty {
		background: color-mix(in oklab, var(--danger) 10%, transparent);
	}

	.counts .incomplete,
	.counts .reports {
		background: color-mix(in oklab, var(--warn) 12%, transparent);
	}

	.counts .manage {
		background: none;
	}

	.counts .manage a {
		color: var(--accent);
		font-weight: 600;
	}

	.filters {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
		overflow-x: auto;
	}

	.filter {
		padding: 6px 14px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
	}

	.filter.active {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.pieces {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.piece {
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-1) var(--space-2);
		margin-bottom: var(--space-2);
	}

	.title {
		font-weight: 600;
	}

	.title:hover {
		color: var(--accent);
	}

	.tag {
		padding: 0 var(--space-2);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.gaps {
		display: grid;
		gap: var(--space-1);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.9375rem;
	}

	.gaps li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}

	.gaps a:hover {
		color: var(--accent);
		text-decoration: underline;
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 0 6px;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.status.missing,
	.status.empty {
		background: color-mix(in oklab, var(--danger) 12%, transparent);
		color: var(--danger);
	}

	.status.incomplete,
	.status.reported {
		background: color-mix(in oklab, var(--warn) 14%, transparent);
		color: var(--warn);
	}

	.status.done {
		background: color-mix(in oklab, var(--ok) 14%, transparent);
		color: var(--ok);
	}

	.muted {
		color: var(--text-muted);
		font-size: 0.875rem;
	}
</style>
