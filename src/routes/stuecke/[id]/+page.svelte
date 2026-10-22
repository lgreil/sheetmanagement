<script lang="ts">
	import { enhance } from '$app/forms';
	import { t } from '#lib/i18n/index.ts';
	import ConcertRow from '#lib/components/ConcertRow.svelte';
	import Crumbs from '#lib/components/Crumbs.svelte';
	import EventRow from '#lib/components/EventRow.svelte';
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
	// Reported as missing but not confirmed yet: shown greyed out, there's no file.
	const reportedMissing = $derived(data.reports.open.filter((report) => report.kind === 'missing' && report.part && !report.fileId));
	let reporting = $state(false);
	let reportFile = $state('');
	const canReport = $derived(data.reports.state === 'ready');
	const reported = $derived(new Set(data.reports.open.map((report) => report.fileId).filter(Boolean)));
	const reportPart = (id: string) => {
		reportFile = id;
		reporting = true;
	};

	/** The piece's few actions as tiles under the title, like on a contact card. */
	const tiles = $derived(
		[
			piece.folderUrl && { href: piece.folderUrl, icon: 'folder' as const, label: t.piece.folder, external: true },
			piece.recording && { href: piece.recording, icon: 'headphones' as const, label: t.piece.recording, external: true },
			data.canEdit && { href: `/stuecke/${encodeURIComponent(piece.id)}/bearbeiten`, icon: 'edit' as const, label: t.piece.editShort, external: false }
		].filter((tile) => !!tile)
	);

	const gaps = $derived(
		piece.parts.filter((part) => part.status !== 'ok' && part.kind !== 'sonstiges' && part.kind !== 'audio').length
	);
</script>

<Title title={piece.title} />

<Crumbs items={[{ href: '/stuecke', label: t.pieces.title }]} />

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
		<span>{piece.status === 'none' ? t.pieces.status.none : t.pieces.parts(piece.partCount)}</span>
		{#each piece.programs as program (program)}<span class="tag program">{program}</span>{/each}
		{#if piece.category}<span class="tag">{piece.category}</span>{/if}
	</div>
	{#if gaps > 0}
		<p class="gaps"><Icon name="alert" size={16} />{t.piece.missingSummary(gaps)}</p>
	{/if}
	{#if data.saved}
		<p class="msg ok" role="status">
			<Icon name="check" size={16} />{t.piece.saved}
			{#if data.renamedIn}{t.pieceEditor.renamed(data.renamedIn)}{/if}
		</p>
	{/if}
</header>

{#if tiles.length || canReport}
	<div class="tiles">
		{#each tiles as tile (tile.icon)}
			<a
				class="tile"
				href={tile.href}
				target={tile.external ? '_blank' : undefined}
				rel={tile.external ? 'noopener noreferrer nofollow' : undefined}
			>
				<Icon name={tile.icon} size={20} /><span>{tile.label}</span>
			</a>
		{/each}
		{#if canReport}
			<button class="tile" class:active={reporting} aria-expanded={reporting} onclick={() => (reporting = !reporting)}>
				<Icon name="flag" size={20} /><span>{t.piece.reportShort}</span>
			</button>
		{/if}
	</div>
{/if}

{#if piece.status === 'none'}
	<p class="placeholder">{t.piece.noMusic}</p>
{/if}

{#each data.loans as loan, i (i)}
	<!-- Rented music: whose it is and when it goes back, before anyone writes in it. -->
	<div class="loan {loan.state}" role="note">
		<Icon name={loan.state === 'overdue' ? 'alert' : 'loan'} size={18} />
		<p>
			<strong>{t.loans.onPiece}</strong>
			{[loan.from && t.loans.from(loan.from), loan.dueAt && t.loans.dueAt(loan.dueAt)].filter(Boolean).join(', ')}
			{#if loan.days !== undefined && loan.state !== 'open'}· {t.loans.due(loan.days)}{/if}
			<span class="loan-hint">{t.loans.onPieceHint}</span>
		</p>
		{#if data.canManageLoans}<a href="/leihmaterial">{t.loans.manage}</a>{/if}
	</div>
{/each}

<ProblemReports
	reports={data.reports.open}
	status={data.reports.state}
	canClose={data.reports.canClose}
	parts={piece.parts.filter((part) => part.status !== 'missing').map(({ id, label }) => ({ id, label }))}
	instruments={data.reports.instruments}
	common={data.reports.common}
	present={data.reports.present}
	result={form}
	trigger={false}
	bind:open={reporting}
	bind:fileId={reportFile}
/>

{#if data.upcoming.length}
	<!-- Where the piece is next: the concert it's played at and the rehearsals that plan it. -->
	<section class="block">
		<h2 class="ui-label">{t.piece.upcoming}</h2>
		<ul class="ui-list">
			{#each data.upcoming as event (event.id)}
				<li><EventRow {event} /></li>
			{/each}
		</ul>
	</section>
{/if}

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
	<section class="block">
		<h2 class="ui-label">{t.piece.groups[group.key]}</h2>
		<ul class="parts">
			{#each group.parts as part (part.id)}
				<li class:flagged={reported.has(part.id)}>
					<!-- A missing part is only a placeholder: nothing to open, so it isn't a link. -->
					<svelte:element
						this={part.status === 'missing' ? 'div' : 'a'}
						class="part"
						class:with-flag={canReport && part.status !== 'missing'}
						class:missing={part.status === 'missing'}
						href={part.status === 'missing' ? undefined : part.url}
						target={part.status === 'missing' ? undefined : '_blank'}
						rel={part.status === 'missing' ? undefined : 'noopener noreferrer'}
						title={part.fileName}
					>
						<span class="icon">
							<Icon name={part.kind === 'audio' ? 'headphones' : 'file'} size={16} />
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
						{#if part.status !== 'missing'}<span class="open"><Icon name="external" size={14} /></span>{/if}
					</svelte:element>
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

{#if reportedMissing.length}
	<section class="block">
		<h2 class="ui-label">{t.piece.reportedMissing}</h2>
		<ul class="parts">
			{#each reportedMissing as report (report.id)}
				<li>
					<div class="part missing" title={t.piece.reportedMissingHint}>
						<span class="icon"><Icon name="file" size={16} /></span>
						<span class="label"><span class="name">{report.part}</span></span>
						<span class="status reported">{t.gaps.reported}</span>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if piece.parts.length}<p class="hint">{t.piece.driveHint}</p>{/if}

<!-- Below the parts: what the piece is, where it was played, related pieces. -->
{#if info.length}
	<section class="block">
		<h2 class="ui-label">{t.piece.details}</h2>
		<dl class="ui-card info">
			{#each info as item (item.key)}
				<div class:wide={item.key === 'notes'}>
					<dt>{item.label}</dt>
					<dd>{item.value}</dd>
				</div>
			{/each}
		</dl>
	</section>
{/if}

{#snippet pieceLinks(pieces: typeof data.moreByComposer)}
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
{/snippet}

<section class="block">
	<div class="played-head">
		<h2 class="ui-label">{t.piece.playedAt}</h2>
		{#if data.again}
			<form method="POST" action="?/again" use:enhance={() => async ({ update }) => update({ reset: false })}>
				<button class="again" class:mine={data.again.mine} aria-pressed={data.again.mine} title={t.piece.againHint}>
					<Icon name="heart" size={16} />{data.again.mine ? t.piece.againMine : t.piece.again}
					{#if data.again.votes}<span class="votes">{t.wishes.votes(data.again.votes)}</span>{/if}
				</button>
			</form>
		{/if}
	</div>
	{#if form?.againError}<p class="placeholder" role="alert">{form.againError}</p>{/if}
	{#if data.again?.planned}<p class="planned"><Icon name="check" size={14} />{t.piece.againPlanned}</p>{/if}
	{#if data.playedAt.length}
		<ul class="ui-list">
			{#each data.playedAt as concert (concert.id)}
				<li><ConcertRow {concert} /></li>
			{/each}
		</ul>
	{:else}
		<p class="placeholder">{data.sheet === 'ok' ? t.piece.playedAtNone : t.piece.playedAtNoSheet}</p>
	{/if}
</section>

{#if data.otherVersions.length}
	<section class="block">
		<h2 class="ui-label">{t.piece.otherVersions}</h2>
		{@render pieceLinks(data.otherVersions)}
	</section>
{/if}
{#if piece.composer && data.moreByComposer.length}
	<details class="block ui-disclosure more-by">
		<summary>{t.piece.moreBy(piece.composer)} <span class="muted">{data.moreByComposer.length}</span></summary>
		{@render pieceLinks(data.moreByComposer)}
	</details>
{/if}

<style>
	.loan {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
		margin-bottom: var(--space-5);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-m);
		background: var(--accent-soft);
	}

	.loan.overdue {
		background: color-mix(in oklab, var(--danger) 12%, transparent);
	}

	.loan.due-soon {
		background: color-mix(in oklab, var(--warn) 14%, transparent);
	}

	.loan :global(svg) {
		flex: none;
	}

	.loan p {
		flex: 1;
		min-width: min(100%, 220px);
	}

	.loan-hint {
		display: block;
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.loan a {
		color: var(--accent);
		font-size: 0.875rem;
		font-weight: 600;
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

	.facts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
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

	.gaps {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--warn);
		font-size: 0.9375rem;
	}

	/* The piece's actions as equal tiles, like on a contact card. */
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
		gap: var(--space-2);
		max-width: 440px;
		margin-bottom: var(--space-6);
	}

	.tile {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 6px;
		min-height: 68px;
		padding: var(--space-2);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-m);
		background: var(--surface);
		box-shadow: var(--shadow);
		color: var(--accent);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform var(--fast) var(--ease),
			background var(--fast) var(--ease);
	}

	.tile span {
		color: var(--text);
		text-align: center;
	}

	.tile:hover {
		background: var(--surface-2);
	}

	.tile:active {
		transform: scale(0.96);
	}

	.tile.active {
		background: var(--accent-soft);
	}

	.block {
		margin-bottom: var(--space-6);
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
		min-height: 38px;
		padding: 0 14px;
		border: 0;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--text);
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background var(--fast) var(--ease),
			color var(--fast) var(--ease);
	}

	/* The complete work is for looking things up, so it's quieter until chosen. */
	.section-tab.complete:not(.active) {
		color: var(--text-muted);
	}

	.section-tab.active {
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
		margin: 0 0 var(--space-5) var(--space-1);
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

	/* One card per group; on wide screens the rows sit in columns, divided by hairlines. */
	.parts {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--hairline);
		border-radius: var(--radius-l);
		background: var(--surface);
		box-shadow: var(--shadow);
		overflow: hidden;
	}

	.parts li {
		position: relative;
		box-shadow:
			0 1px 0 var(--hairline),
			1px 0 0 var(--hairline);
	}

	.part {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 54px;
		height: 100%;
		padding: var(--space-2) var(--space-4);
		transition: background var(--fast) var(--ease);
	}

	a.part:hover {
		background: var(--surface-2);
	}

	.part.with-flag {
		padding-right: 48px;
	}

	.flag {
		position: absolute;
		top: 50%;
		right: 8px;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border: 0;
		border-radius: 10px;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
		transform: translateY(-50%);
		/* Quiet, but still 3:1 against the row (#141). */
		opacity: 0.75;
		transition:
			opacity var(--fast) var(--ease),
			background var(--fast) var(--ease);
	}

	li:hover .flag {
		opacity: 1;
	}

	.flag:hover,
	.flag:focus-visible,
	.flagged .flag {
		background: color-mix(in oklab, var(--warn) 14%, transparent);
		color: var(--warn);
		opacity: 1;
	}

	.flagged .part {
		background: color-mix(in oklab, var(--warn) 6%, transparent);
	}

	.part.missing {
		color: var(--text-muted);
		cursor: default;
	}

	.icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 32px;
		height: 32px;
		border-radius: 9px;
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
		opacity: 0;
		transition: opacity var(--fast) var(--ease);
	}

	.part:hover .open,
	.part:focus-visible .open {
		opacity: 1;
		color: var(--accent);
	}

	/* No hover on touch screens: the hint that a part opens elsewhere stays visible. */
	@media (hover: none) {
		.open {
			opacity: 0.75;
		}
	}

	.placeholder {
		margin-bottom: var(--space-5);
		padding: var(--space-4) var(--space-5);
		border: 1px dashed var(--border);
		border-radius: var(--radius-l);
		color: var(--text-muted);
	}

	.hint {
		margin: calc(-1 * var(--space-4)) var(--space-1) var(--space-7);
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.info {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: var(--space-4);
		margin: 0;
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

	.played-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.played-head .ui-label {
		margin-bottom: 0;
	}

	.again {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: 36px;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--text);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background var(--fast) var(--ease),
			transform var(--fast) var(--ease);
	}

	.again:active {
		transform: scale(0.96);
	}

	.again.mine {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.again .votes {
		color: var(--text-muted);
		font-weight: 700;
	}

	.planned {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-bottom: var(--space-2);
		color: var(--ok);
		font-size: 0.875rem;
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
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-m);
		background: var(--surface);
		transition: background var(--fast) var(--ease);
	}

	.more-list a:hover {
		background: var(--surface-2);
	}

	.more-title {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 400;
	}

	.more-by[open] summary {
		margin-bottom: var(--space-3);
	}
</style>
