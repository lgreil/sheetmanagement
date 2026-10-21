<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { t } from '#lib/i18n/index.ts';
	import Crumbs from '#lib/components/Crumbs.svelte';
	import EventRow from '#lib/components/EventRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import InstrumentationMatrix from '#lib/components/InstrumentationMatrix.svelte';
	import ProgramList from '#lib/components/ProgramList.svelte';
	import Segmented from '#lib/components/Segmented.svelte';
	import ShareButton from '#lib/components/ShareButton.svelte';
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
	/** For the group chat: when, where and, for a concert, what's played. */
	const shareText = $derived(
		[
			title,
			data.kind === 'event'
				? [data.event.date.long, data.event.date.time].filter(Boolean).join(', ')
				: (data.archive.label?.long ?? data.archive.dateText),
			location,
			...(isConcert && data.program.items.length
				? ['', `${t.concert.program}:`, ...data.program.items.map((item, i) => `${i + 1}. ${item.title}`)]
				: [])
		]
			.filter((line) => line !== undefined)
			.join('\n')
	);
	const check = $derived(data.program.check);
	const checkOpen = $derived(check?.filter((item) => !item.ok).length ?? 0);

	/**
	 * Planners get two views of a concert: what every member sees, and "Planung" with the
	 * check, the tools, the instrumentation and attendance. Members see one calm page.
	 */
	const planning = $derived(data.kind === 'event' ? data.planning : null);
	// svelte-ignore state_referenced_locally
	let view = $state<'overview' | 'planung'>(page.url.searchParams.has('planung') ? 'planung' : 'overview');
	function changeView(next: 'overview' | 'planung') {
		const url = new URL(page.url.href);
		if (next === 'planung') url.searchParams.set('planung', '');
		else url.searchParams.delete('planung');
		// Linkable, without a new history entry for every switch.
		replaceState(url, {});
	}
	const overview = $derived(!planning || view === 'overview');
	const planner = $derived(!planning || view === 'planung');
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
	<div class="head-actions">
		{#if partsUrl}
			<a class="btn" href={partsUrl}><Icon name="parts" size={18} />{t.nav.myParts}</a>
		{/if}
		<div class="ui-actions"><ShareButton {title} text={shareText} url={page.url.pathname} /></div>
	</div>
</header>

{#if planning}
	<div class="views">
		<Segmented
			label={t.concert.views.label}
			options={[
				{ value: 'overview', label: t.concert.views.overview, icon: 'calendar' },
				{ value: 'planung', label: checkOpen ? `${t.concert.views.planning} · ${checkOpen}` : t.concert.views.planning, icon: 'list' }
			]}
			bind:value={view}
			onchange={changeView}
		/>
	</div>
{/if}

{#if overview}
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
				<span class="icon concert"><Icon name="link" size={18} /></span>
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
{/if}

{#if check && planner}
	<!-- For planners: what's done and what's still open, worked out from the data. -->
	<details class="block check" open={checkOpen > 0}>
		<summary>
			<span class="check-icon" class:done={!checkOpen}><Icon name={checkOpen ? 'list' : 'check'} size={18} /></span>
			<span class="check-title">
				<strong>{t.check.title}</strong>
				<span>{checkOpen ? t.check.open(checkOpen) : t.check.allDone}</span>
			</span>
		</summary>
		<ul>
			{#each check as item (item.key)}
				<li class:ok={item.ok}>
					<Icon name={item.ok ? 'check' : 'alert'} size={16} />
					{#if item.href && !item.ok}
						<a href={item.href}>{item.text}</a>
					{:else}
						<span>{item.text}</span>
					{/if}
				</li>
			{/each}
		</ul>
	</details>
{/if}

{#if planning && view === 'planung'}
	<!-- Everything a planner works with for this concert, one tap each. -->
	<section class="block">
		<h2 class="ui-label">{t.concert.tools}</h2>
		<ul class="ui-list tools">
			{#if data.program.canEdit}
				<li><a href="/konzerte/{id}/programm"><Icon name="edit" size={18} /><span>{t.editor.edit}</span><Icon name="chevron" size={18} /></a></li>
			{/if}
			{#if data.kind === 'event' && data.rehearsalPlan.editUrl}
				<li><a href={data.rehearsalPlan.editUrl}><Icon name="calendar" size={18} /><span>{t.rehearsalPlan.edit}</span><Icon name="chevron" size={18} /></a></li>
			{/if}
			{#if planning.attendanceUrl}
				<li>
					<a href={planning.attendanceUrl.href}>
						<Icon name="users" size={18} /><span>{t.concert.lastAttendance}<small>{planning.attendanceUrl.label}</small></span><Icon name="chevron" size={18} />
					</a>
				</li>
			{/if}
			{#if planning.printUrl}
				<li><a href={planning.printUrl}><Icon name="print" size={18} /><span>{t.print.handout} · {t.print.setlist}</span><Icon name="chevron" size={18} /></a></li>
			{/if}
			{#if planning.reportUrl}
				<li><a href={planning.reportUrl}><Icon name="table" size={18} /><span>{t.musicReport.tab}</span><Icon name="chevron" size={18} /></a></li>
			{/if}
		</ul>
	</section>
{/if}

{#if overview}
{#if data.kind === 'event' && data.attendance?.kind === 'rehearsal'}
	<section class="block">
		<h2 class="ui-label">{t.attendance.title}</h2>
		{#if data.attendanceSaved}<p class="saved" role="status"><Icon name="check" size={16} />{t.attendance.saved}</p>{/if}
		{#if data.attendance.state === 'not-set-up'}
			<p class="placeholder">{t.attendance.notSetUp}</p>
		{:else}
			<a class="ui-card attendance-link" href={data.attendance.url}>
				<span class="icon"><Icon name="users" size={18} /></span>
				<span class="fact-body">
					<strong>{data.attendance.of ? t.attendance.present(data.attendance.present, data.attendance.of) : t.attendance.notTaken}</strong>
					<span>{data.attendance.of ? t.attendance.edit : t.attendance.take}</span>
				</span>
				<span class="trail"><Icon name="chevron" size={18} /></span>
			</a>
		{/if}
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
			<ProgramList items={data.program.items} total />
			<!-- Where it's kept only matters to those who keep it. -->
			{#if data.program.canEdit}<p class="hint">{t.concert.programHint}</p>{/if}
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
		{#if data.attendance?.kind === 'concert' && data.attendance.mine}
			<p class="note mine"><Icon name="users" size={16} /><span>{t.attendance.mine(data.attendance.mine.present, data.attendance.mine.of)}</span></p>
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
			<ProgramList items={data.rehearsalPlan.items} total />
		{:else}
			<p class="placeholder">{t.rehearsalPlan.empty}</p>
		{/if}
	</section>
{/if}

{/if}

{#if planner && data.kind === 'event' && data.attendance?.kind === 'concert' && data.attendance.table}
	{@const summary = data.attendance}
	<section class="block">
		<h2 class="ui-label">{t.attendance.overview}</h2>
		{#if summary.table}
			<div class="ui-card attendance">
				<p class="hint">{t.attendance.overviewLead(summary.taken)} {t.attendance.overviewHint}</p>
				<div class="scroll">
					<table>
						<thead>
							<tr>
								<th>{t.attendance.person}</th>
								<th>{t.attendance.total}</th>
								{#each summary.table.columns as column, i (i)}<th title={column}><span>{column}</span></th>{/each}
							</tr>
						</thead>
						<tbody>
							{#each summary.table.rows as row, r (r)}
								<tr>
									<td>{row.name}</td>
									<td class="count" class:low={row.of && row.present / row.of < 0.5}>{t.attendance.count(row.present, row.of)}</td>
									{#each row.pieces as cell, i (i)}
										<td class="count" class:low={cell && cell.of && cell.present === 0}>{cell ? t.attendance.count(cell.present, cell.of) : '–'}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</section>
{/if}

{#if planner && isConcert && data.program.instrumentation}
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

	.views {
		margin-bottom: var(--space-5);
	}

	.tools a {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 52px;
		padding: var(--space-2) var(--space-4);
		transition: background var(--fast) var(--ease);
	}

	.tools a:hover {
		background: var(--surface-2);
	}

	.tools a > :global(svg:first-child) {
		color: var(--accent);
	}

	.tools a > :global(svg:last-child) {
		color: var(--text-muted);
	}

	.tools span {
		display: grid;
		flex: 1;
		font-weight: 600;
	}

	.tools small {
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 400;
	}

	.note.mine {
		margin-top: var(--space-3);
	}

	.head-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3) var(--space-5);
		margin-top: var(--space-3);
	}

	.check {
		border: 1px solid var(--hairline);
		border-radius: var(--radius-l);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.check summary {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		cursor: pointer;
		list-style: none;
	}

	.check summary::-webkit-details-marker {
		display: none;
	}

	.check-icon {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		background: color-mix(in oklab, var(--warn) 14%, transparent);
		color: var(--warn);
	}

	.check-icon.done {
		background: color-mix(in oklab, var(--ok) 14%, transparent);
		color: var(--ok);
	}

	.check-title {
		display: grid;
		line-height: 1.35;
	}

	.check-title span {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.check ul {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0 var(--space-4) var(--space-4) calc(34px + var(--space-3) + var(--space-4));
		list-style: none;
	}

	.check li {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		font-size: 0.9375rem;
	}

	.check li :global(svg) {
		flex: none;
		margin-top: 3px;
		color: var(--warn);
	}

	.check li.ok {
		color: var(--text-muted);
	}

	.check li.ok :global(svg) {
		color: var(--ok);
	}

	.check a {
		color: var(--accent);
		font-weight: 600;
	}

	@media (max-width: 480px) {
		.check ul {
			padding-left: var(--space-4);
		}
	}

	.attendance-link {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
	}

	.attendance-link:hover {
		background: var(--surface-2);
	}

	.attendance {
		padding: var(--space-4);
	}

	.attendance .hint {
		margin: 0 0 var(--space-3);
	}

	.scroll {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th,
	td {
		padding: var(--space-2);
		border-bottom: 1px solid var(--hairline);
		text-align: left;
		white-space: nowrap;
	}

	th {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 650;
	}

	th span {
		display: inline-block;
		max-width: 9rem;
		overflow: hidden;
		text-overflow: ellipsis;
		vertical-align: bottom;
	}

	td.count {
		font-variant-numeric: tabular-nums;
	}

	td.low {
		color: var(--danger);
		font-weight: 600;
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
