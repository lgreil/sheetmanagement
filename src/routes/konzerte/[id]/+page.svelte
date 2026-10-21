<script lang="ts">
	import { page } from '$app/state';
	import { t } from '#lib/i18n/index.ts';
	import Crumbs from '#lib/components/Crumbs.svelte';
	import EventRow from '#lib/components/EventRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import InstrumentationMatrix from '#lib/components/InstrumentationMatrix.svelte';
	import ProgramList from '#lib/components/ProgramList.svelte';
	import Signups from '#lib/components/Signups.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
	const id = $derived(encodeURIComponent(page.params.id ?? ''));
	const title = $derived(data.kind === 'event' ? data.event.displayTitle : data.archive.title);
	const location = $derived(data.kind === 'event' ? data.event.location : data.archive.location);
	const isConcert = $derived(data.kind === 'archive' || data.event.type === 'konzert');

	/** A rehearsal sits below its concert: "Konzerte › Herbstkonzert › Probe". */
	const crumbs = $derived([
		{ href: '/konzerte', label: t.concerts.title },
		...(data.kind === 'event' && !isConcert && data.concert
			? [{ href: `/konzerte/${encodeURIComponent(data.concert.id)}`, label: data.concert.displayTitle }]
			: [])
	]);

	/** The page's one main action: the member's parts for this concert or rehearsal. */
	const partsUrl = $derived(
		data.kind !== 'event' || data.event.past
			? undefined
			: isConcert
				? data.program.items.length
					? `/meine-noten?konzert=${id}`
					: undefined
				: data.rehearsalPlan.partsUrl
	);
	const showPlan = $derived(
		data.kind === 'event' &&
			!isConcert &&
			data.event.type !== 'sonstiges' &&
			(data.rehearsalPlan.items.length || data.rehearsalPlan.editUrl || data.rehearsalPlan.partsUrl)
	);
</script>

<Title {title} />

<Crumbs items={crumbs} />

<header class="head {data.kind === 'event' ? data.event.type : 'konzert'}">
	<p class="eyebrow">
		{data.kind === 'event' ? t.concerts.types[data.event.type] : t.concert.archive}
		{#if data.kind === 'event' && data.event.tentative}<span class="tentative">{t.concerts.tentative}</span>{/if}
		{#if data.kind === 'event' && !data.event.past}<span class="relative">{t.concerts.relative(data.event.daysUntil)}</span>{/if}
	</p>
	<h1>{title}</h1>
	{#if partsUrl}
		<a class="btn main-action" href={partsUrl}><Icon name="user" size={18} />{t.nav.myParts}</a>
	{/if}
</header>

<!-- The facts as one calm list: when, where, what it belongs to. -->
<ul class="ui-list facts">
	<li>
		<div class="fact">
			<span class="icon"><Icon name="calendar" size={18} /></span>
			<span class="fact-body">
				{#if data.kind === 'event'}
					<strong>{data.event.date.long}</strong>
					<span>{data.event.date.time || t.concerts.allDay}</span>
				{:else}
					<strong>{data.archive.label?.long ?? (data.archive.dateText || t.concert.dateUnknown)}</strong>
				{/if}
			</span>
		</div>
	</li>
	{#if location}
		<li>
			<svelte:element
				this={data.mapUrl ? 'a' : 'div'}
				class="fact"
				href={data.mapUrl}
				target={data.mapUrl ? '_blank' : undefined}
				rel={data.mapUrl ? 'noopener noreferrer' : undefined}
			>
				<span class="icon"><Icon name="pin" size={18} /></span>
				<span class="fact-body">
					<strong>{location.split(',')[0].trim()}</strong>
					{#if location.includes(',')}<span>{location.split(',').slice(1).join(',').trim()}</span>{/if}
				</span>
				{#if data.mapUrl}<span class="trail">{t.concert.map}<Icon name="external" size={14} /></span>{/if}
			</svelte:element>
		</li>
	{/if}
	{#if data.kind === 'event' && !isConcert && data.concert}
		<li>
			<a class="fact" href="/konzerte/{encodeURIComponent(data.concert.id)}">
				<span class="icon concert"><Icon name="sparkle" size={18} /></span>
				<span class="fact-body">
					<span class="over">{t.concert.preparesFor}</span>
					<strong>{data.concert.displayTitle}</strong>
					<span>{data.concert.date.long} · {t.concerts.relative(data.concert.daysUntil)}</span>
				</span>
				<span class="trail"><Icon name="chevron" size={18} /></span>
			</a>
		</li>
	{/if}
	{#if data.kind === 'event' && data.event.url}
		<li>
			<a class="fact quiet" href={data.event.url} target="_blank" rel="noopener noreferrer">
				<span class="icon"><Icon name="external" size={16} /></span>
				<span class="fact-body"><span>{t.concert.openInCalendar}</span></span>
			</a>
		</li>
	{/if}
</ul>

{#if data.kind === 'event' && data.event.description}
	<section class="block">
		<h2 class="ui-label">{t.concert.description}</h2>
		<p class="ui-card description">{data.event.description}</p>
	</section>
{/if}

{#if data.kind === 'event' && data.signups}
	{#if data.signups.state === 'ready'}
		<Signups signups={data.signups} result={form} />
	{:else}
		<p class="placeholder block">{data.signups.state === 'sign-in' ? t.signups.signInNeeded : t.signups.notSetUp}</p>
	{/if}
{/if}

{#if isConcert}
	<section class="block">
		<div class="block-head">
			<h2 class="ui-label">{t.concert.program}</h2>
			<div class="ui-actions">
				{#if data.program.items.length}
					<a href="/konzerte/{id}/drucken"><Icon name="print" size={16} />{t.print.link}</a>
				{/if}
				{#if data.program.canEdit}
					<a href="/konzerte/{id}/programm"><Icon name="edit" size={16} />{t.editor.edit}</a>
				{/if}
			</div>
		</div>
		{#if data.program.saved}<p class="saved" role="status"><Icon name="check" size={16} />{t.editor.saved}</p>{/if}
		{#if data.program.sharedFrom}
			<p class="note">
				<Icon name="link" size={16} />
				<span>{t.concert.sharedFrom} <a href="/konzerte/{encodeURIComponent(data.program.sharedFrom.id)}">{data.program.sharedFrom.title}</a></span>
			</p>
		{:else if data.program.sharedWith.length}
			<p class="note">
				<Icon name="link" size={16} />
				<span>
					{t.concert.sharedWith}
					{#each data.program.sharedWith as other, i (other.id)}{i ? ', ' : ' '}<a href="/konzerte/{encodeURIComponent(other.id)}">{other.title}</a>{/each}
				</span>
			</p>
		{/if}
		{#if data.program.canEdit && data.program.suggestions}
			<p class="note">
				<Icon name="bulb" size={16} />
				<a href="/konzerte/{id}/programm">{t.editor.openSuggestions(data.program.suggestions)}</a>
			</p>
		{/if}
		{#if data.program.items.length}
			<ProgramList items={data.program.items} />
			<p class="hint">{t.concert.programHint}</p>
		{:else}
			<p class="placeholder">{data.program.sheet === 'ok' ? t.concert.programEmpty : t.concert.programNoSheet}</p>
		{/if}
	</section>
{/if}

{#if data.kind === 'event' && isConcert}
	<section class="block">
		<div class="block-head">
			<h2 class="ui-label">{t.concert.rehearsals}</h2>
			{#if data.rehearsalPlan.editUrl}
				<div class="ui-actions">
					<a href={data.rehearsalPlan.editUrl}><Icon name="edit" size={16} />{t.rehearsalPlan.edit}</a>
				</div>
			{/if}
		</div>
		{#if page.url.searchParams.has('probenplan')}<p class="saved" role="status"><Icon name="check" size={16} />{t.rehearsalPlan.saved}</p>{/if}
		{#if data.rehearsals.length}
			{@const upcoming = data.rehearsals.filter((r) => !r.past)}
			<!-- Before the concert, past rehearsals fold away so the next ones come first. -->
			{@const folded = upcoming.length ? data.rehearsals.filter((r) => r.past) : []}
			{#snippet rehearsalList(list: typeof data.rehearsals)}
				<ul class="ui-list">
					{#each list as rehearsal (rehearsal.id)}
						<li>
							<EventRow event={rehearsal} />
							{#if rehearsal.planned.length}
								<!-- What's on, each piece one tap away. -->
								<ul class="planned" aria-label={t.rehearsalPlan.title}>
									{#each rehearsal.planned as item, i (i)}
										<li>
											{#if item.pieceId}
												<a class="chip" href="/stuecke/{encodeURIComponent(item.pieceId)}">{item.title}</a>
											{:else}
												<span class="chip">{item.title}</span>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			{/snippet}
			{#if folded.length}
				<details class="past-rehearsals">
					<summary><Icon name="chevron" size={16} />{t.concert.pastRehearsals(folded.length)}</summary>
					{@render rehearsalList(folded)}
				</details>
			{/if}
			{@render rehearsalList(folded.length ? upcoming : data.rehearsals)}
		{:else}
			<p class="placeholder">{t.concert.noRehearsals}</p>
		{/if}
	</section>
{:else if data.kind === 'event' && showPlan}
	<section class="block">
		<div class="block-head">
			<h2 class="ui-label">{t.rehearsalPlan.title}</h2>
			{#if data.rehearsalPlan.editUrl}
				<div class="ui-actions">
					<a href={data.rehearsalPlan.editUrl}><Icon name="edit" size={16} />{t.rehearsalPlan.edit}</a>
				</div>
			{/if}
		</div>
		{#if data.rehearsalPlan.items.length}
			<ProgramList items={data.rehearsalPlan.items} />
		{:else}
			<p class="placeholder">{t.rehearsalPlan.empty}</p>
		{/if}
	</section>
{/if}

{#if isConcert && data.program.instrumentation}
	<InstrumentationMatrix {...data.program.instrumentation} />
{/if}

<style>
	.head {
		display: grid;
		justify-items: start;
		gap: var(--space-2);
		margin-bottom: var(--space-5);
	}

	.eyebrow {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 650;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	.head.konzert .eyebrow {
		color: var(--accent);
	}

	.head.generalprobe .eyebrow {
		color: var(--warn);
	}

	.tentative {
		padding: 0 6px;
		border-radius: 6px;
		background: color-mix(in oklab, var(--warn) 14%, transparent);
		color: var(--warn);
		letter-spacing: 0;
		text-transform: none;
	}

	.relative {
		color: var(--text-muted);
		font-weight: 500;
		letter-spacing: 0;
		text-transform: none;
	}

	.main-action {
		margin-top: var(--space-3);
	}

	.facts {
		margin-bottom: var(--space-6);
	}

	.fact {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 60px;
		padding: var(--space-3) var(--space-4);
		transition: background var(--fast) var(--ease);
	}

	a.fact:hover {
		background: var(--surface-2);
	}

	.icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		background: var(--surface-2);
		color: var(--text-muted);
	}

	.icon.concert {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.fact-body {
		display: grid;
		flex: 1;
		min-width: 0;
		line-height: 1.35;
	}

	.fact-body strong {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.fact-body span {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.fact-body .over {
		font-size: 0.75rem;
		font-weight: 650;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.fact.quiet .fact-body span {
		color: var(--accent);
		font-weight: 600;
	}

	.trail {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: var(--space-1);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	a.fact:hover .trail {
		color: var(--accent);
	}

	.block {
		margin-bottom: var(--space-6);
	}

	.block-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0 var(--space-3);
	}

	.block-head .ui-actions {
		margin-bottom: var(--space-2);
	}

	.description {
		white-space: pre-line;
		overflow-wrap: anywhere;
	}

	.placeholder {
		padding: var(--space-4) var(--space-5);
		border: 1px dashed var(--border);
		border-radius: var(--radius-l);
		color: var(--text-muted);
	}

	.hint {
		margin: var(--space-2) var(--space-1) 0;
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.saved {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-m);
		background: color-mix(in oklab, var(--ok) 12%, transparent);
	}

	.note {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0 0 var(--space-3) var(--space-1);
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.note :global(svg) {
		flex: none;
		color: var(--accent);
	}

	.note a {
		color: var(--accent);
		font-weight: 600;
	}

	/* Indented to line up with the rehearsal's title, past its date tile. */
	.past-rehearsals {
		margin-bottom: var(--space-3);
	}

	.past-rehearsals summary {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: 32px;
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 600;
		list-style: none;
		cursor: pointer;
	}

	.past-rehearsals summary::-webkit-details-marker {
		display: none;
	}

	.past-rehearsals summary :global(svg) {
		transition: transform var(--fast) var(--ease);
	}

	.past-rehearsals[open] summary :global(svg) {
		transform: rotate(90deg);
	}

	.past-rehearsals[open] {
		margin-bottom: var(--space-4);
		opacity: 0.85;
	}

	.planned {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: calc(-1 * var(--space-2)) 0 0;
		padding: 0 var(--space-4) var(--space-3) calc(52px + 2 * var(--space-4));
		list-style: none;
	}

	.chip {
		display: inline-block;
		max-width: 100%;
		padding: 3px 10px;
		overflow: hidden;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--text);
		font-size: 0.8125rem;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition:
			background var(--fast) var(--ease),
			color var(--fast) var(--ease);
	}

	a.chip:hover {
		background: var(--accent-soft);
		color: var(--accent);
	}

	@media (max-width: 480px) {
		.planned {
			padding-left: var(--space-4);
		}
	}
</style>
