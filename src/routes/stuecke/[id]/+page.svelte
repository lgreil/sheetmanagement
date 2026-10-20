<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import ConcertRow from '#lib/components/ConcertRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import ProblemReports from '#lib/components/ProblemReports.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
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

	// A symphony may have sections: what is played, single movements, the complete work.
	// The chosen tab belongs to one piece, so another piece opens on its own first section.
	let chosen = $state<{ piece: string; key: string } | null>(null);
	const sections = $derived(piece.sections);
	const current = $derived(
		sections.find((section) => chosen?.piece === piece.id && section.key === chosen.key) ?? sections[0]
	);
	const shown = $derived(current ? piece.parts.filter((part) => part.section === current.key) : piece.parts);

	const groups = $derived(
		GROUP_ORDER.map((key) => ({ key, parts: shown.filter((part) => groupOf(part) === key) })).filter(
			(group) => group.parts.length > 0
		)
	);

	const info = $derived(
		(Object.keys(t.piece.info) as (keyof typeof t.piece.info)[])
			.map((key) => ({ key, label: t.piece.info[key], value: piece.info[key] }))
			.filter((item) => item.value)
	);

	// Reporting a single part opens the form with that part chosen.
	let reporting = $state(false);
	let reportFile = $state('');
	const canReport = $derived(data.reports.state === 'ready');
	const reported = $derived(new Set(data.reports.open.map((report) => report.fileId).filter(Boolean)));
	const reportPart = (id: string) => {
		reportFile = id;
		reporting = true;
	};

	const gaps = $derived(
		piece.parts.filter((part) => part.status !== 'ok' && part.kind !== 'sonstiges' && part.kind !== 'audio').length
	);
</script>

<Title title={piece.title} />

<a class="back" href="/stuecke"><Icon name="back" size={18} />{t.piece.back}</a>

<header class="head">
	{#if piece.composer || piece.catalogue}
		<p class="eyebrow">
			{#if piece.composer}
				<a href="/stuecke?komponist={encodeURIComponent(piece.composer)}" title={t.piece.allBy(piece.composer)}>{piece.composer}</a>
			{/if}
			{#if piece.composer && piece.catalogue}·{/if}
			{piece.catalogue ?? ''}
		</p>
	{/if}
	<h1>{piece.title}</h1>
	<div class="facts">
		{#if piece.status === 'none'}
			<span>{t.pieces.status.none}</span>
		{:else}
			<span>{t.pieces.parts(piece.partCount)}</span>
		{/if}
		{#each piece.programs as program (program)}<span class="tag program">{program}</span>{/each}
		{#if piece.category}<span class="tag">{piece.category}</span>{/if}
		{#if piece.folderUrl}
			<a class="drive" href={piece.folderUrl} target="_blank" rel="noopener noreferrer">
				<Icon name="folder" size={16} />
				{t.piece.openFolder}
			</a>
		{/if}
		{#if piece.recording}
			<a class="drive" href={piece.recording} target="_blank" rel="noopener noreferrer nofollow">
				<Icon name="headphones" size={16} />
				{t.piece.recording}
			</a>
		{/if}
		{#if data.canEdit}
			<a class="drive" href="/stuecke/{encodeURIComponent(piece.id)}/bearbeiten">
				<Icon name="file" size={16} />
				{t.piece.edit}
			</a>
		{/if}
	</div>
	{#if data.saved}
		<p class="msg ok" role="status">
			<Icon name="check" size={16} />{t.piece.saved}
			{#if data.renamedIn}{t.pieceEditor.renamed(data.renamedIn)}{/if}
		</p>
	{/if}
	{#if gaps > 0}
		<p class="gaps"><Icon name="alert" size={16} />{t.piece.missingSummary(gaps)}</p>
	{/if}
</header>

{#if piece.status === 'none'}
	<p class="no-music">{t.piece.noMusic}</p>
{/if}

<ProblemReports
	reports={data.reports.open}
	status={data.reports.state}
	canClose={data.reports.canClose}
	parts={piece.parts.filter((part) => part.status !== 'missing').map(({ id, label }) => ({ id, label }))}
	result={form}
	bind:open={reporting}
	bind:fileId={reportFile}
/>

{#if sections.length > 1 && current}
	<div class="sections" role="tablist" aria-label={t.piece.sections}>
		{#each sections as section (section.key)}
			<button
				role="tab"
				class="section-tab"
				class:active={section.key === current.key}
				class:complete={section.kind === 'complete'}
				aria-selected={section.key === current.key}
				onclick={() => (chosen = { piece: piece.id, key: section.key })}
			>
				<span>{section.label}</span>
				{#if section.kind === 'played'}<span class="badge">{t.piece.playedBadge}</span>{/if}
				<span class="count">{section.partCount}</span>
			</button>
		{/each}
	</div>
	{#if t.piece.sectionHint[current.kind] || current.key}
		<p class="section-hint">
			{t.piece.sectionHint[current.kind]}
			{#if current.key}
				<a href={current.folderUrl} target="_blank" rel="noopener noreferrer">
					<Icon name="folder" size={14} />{t.piece.sectionFolder}
				</a>
			{/if}
		</p>
	{/if}
{/if}

{#each groups as group (`${current?.key}:${group.key}`)}
	<section class="group">
		<h2>{t.piece.groups[group.key]}</h2>
		<ul class="parts">
			{#each group.parts as part (part.id)}
				<li class:flagged={reported.has(part.id)}>
					<a
						class="part"
						class:with-flag={canReport && part.status !== 'missing'}
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
							{#if part.notes.length || (part.subfolder && sections.length < 2)}
								<span class="notes">
									{#each part.notes as note (note)}<span class="note">{note}</span>{/each}
									<!-- With tabs, the subfolder is the tab; a lone subfolder is still worth naming. -->
									{#if part.subfolder && sections.length < 2}<span class="note">{part.subfolder}</span>{/if}
								</span>
							{/if}
						</span>
						{#if part.status !== 'ok'}
							<span class="status {part.status}">{t.piece.partStatus[part.status]}</span>
						{/if}
						<span class="open"><Icon name="external" size={16} /></span>
					</a>
					{#if canReport && part.status !== 'missing'}
						<button
							class="flag"
							title={t.reports.reportPart(part.label)}
							aria-label={t.reports.reportPart(part.label)}
							onclick={() => reportPart(part.id)}
						>
							<Icon name="flag" size={15} />
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/each}

<!-- Most used first: the parts above, then details, concerts and related pieces. -->
{#if info.length}
	<dl class="info" aria-label={t.piece.details}>
		{#each info as item (item.key)}
			<div class:wide={item.key === 'notes'}>
				<dt>{item.label}</dt>
				<dd>{item.value}</dd>
			</div>
		{/each}
	</dl>
{/if}

{#snippet pieceLinks(title: string, pieces: typeof data.moreByComposer)}
	<section class="more">
		{#if title}<h2>{title}</h2>{/if}
		<ul class="more-list">
			{#each pieces as other (other.id)}
				<li>
					<a href="/stuecke/{other.id}">
						<span class="more-title">{other.title}</span>
						{#if other.catalogue}<span class="muted">{other.catalogue}</span>{/if}
						{#each other.programs as program (program)}<span class="tag program">{program}</span>{/each}
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/snippet}

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

{#if data.otherVersions.length}
	{@render pieceLinks(t.piece.otherVersions, data.otherVersions)}
{/if}
{#if piece.composer && data.moreByComposer.length}
	<details class="more-by">
		<summary>{t.piece.moreBy(piece.composer)} <span class="muted">({data.moreByComposer.length})</span></summary>
		{@render pieceLinks('', data.moreByComposer)}
	</details>
{/if}

{#if piece.parts.length}<p class="hint">{t.piece.driveHint}</p>{/if}

<style>
	.more-by {
		margin-top: var(--space-6);
	}

	.more-by summary {
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
	}

	.more-by :global(.more) {
		margin-top: var(--space-3);
	}

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

	.eyebrow a {
		text-decoration: underline;
		text-decoration-color: color-mix(in oklab, var(--accent) 35%, transparent);
		text-underline-offset: 3px;
	}

	.eyebrow a:hover {
		text-decoration-color: var(--accent);
	}

	.sections {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
		overflow-x: auto;
		scrollbar-width: none;
	}

	.section-tab {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: var(--space-2);
		padding: 8px 14px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}

	.section-tab:hover {
		border-color: var(--accent);
	}

	/* The complete work is for looking things up, so it's quieter until chosen. */
	.section-tab.complete:not(.active) {
		border-style: dashed;
		color: var(--text-muted);
	}

	.section-tab.active {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.badge {
		padding: 0 6px;
		border-radius: 6px;
		background: color-mix(in oklab, var(--ok) 18%, transparent);
		color: var(--ok);
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.section-tab.active .badge {
		background: color-mix(in oklab, var(--accent-contrast) 25%, transparent);
		color: var(--accent-contrast);
	}

	.count {
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.section-tab.active .count {
		color: color-mix(in oklab, var(--accent-contrast) 80%, transparent);
	}

	.section-hint {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1) var(--space-3);
		margin: 0 0 var(--space-4) var(--space-1);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.section-hint a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--accent);
		font-weight: 600;
	}

	.more {
		margin-top: var(--space-6);
	}

	.more h2 {
		margin: 0 0 var(--space-2) var(--space-1);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.more-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.more-list a {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1) var(--space-2);
		height: 100%;
		padding: var(--space-3);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		transition: border-color 0.15s;
	}

	.more-list a:hover {
		border-color: var(--accent);
	}

	.more-title {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--text-muted);
		font-size: 0.875rem;
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

	.tag.program {
		background: var(--accent);
		color: var(--accent-contrast);
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

	.parts li {
		position: relative;
	}

	.part.with-flag {
		padding-right: 44px;
	}

	.flag {
		position: absolute;
		top: 50%;
		right: 6px;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
		transform: translateY(-50%);
		opacity: 0.55;
	}

	.flag:hover,
	.flag:focus-visible,
	.flagged .flag {
		background: color-mix(in oklab, var(--warn) 14%, transparent);
		color: var(--warn);
		opacity: 1;
	}

	.flagged .part {
		border-color: color-mix(in oklab, var(--warn) 45%, var(--border));
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
		margin: var(--space-6) 0 0;
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
