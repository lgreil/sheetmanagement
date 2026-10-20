<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import type { ShownEvent } from '#lib/events/schedule.ts';
	import AddToArchive from '#lib/components/AddToArchive.svelte';
	import CalendarView from '#lib/components/CalendarView.svelte';
	import ConcertRow from '#lib/components/ConcertRow.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import EventRow from '#lib/components/EventRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();

	type Filter = 'all' | 'concerts' | 'rehearsals';
	let filter = $state<Filter>('all');

	// svelte-ignore state_referenced_locally
	let view = $state(data.view);
	/** Remembered in a cookie, so the next visit starts in the same view without a jump. */
	function show(next: 'list' | 'calendar') {
		view = next;
		document.cookie = `konzerte-ansicht=${next === 'calendar' ? 'kalender' : 'liste'}; path=/konzerte; max-age=31536000; samesite=lax`;
	}
	const calendarEvents = $derived(
		data.events.filter((event) =>
			filter === 'concerts' ? event.type === 'konzert' : filter === 'rehearsals' ? event.type === 'probe' || event.type === 'generalprobe' : true
		)
	);

	export const snapshot = {
		capture: () => filter,
		restore: (value: Filter) => (filter = value)
	};

	const shown = $derived(
		data.upcoming.filter((event) =>
			filter === 'concerts'
				? event.type === 'konzert'
				: filter === 'rehearsals'
					? event.type === 'probe' || event.type === 'generalprobe'
					: true
		)
	);

	/** The very next date stands out in the list. */
	const next = $derived(shown[0]?.id);

	const months = $derived.by(() => {
		const result: { key: string; label: string; events: ShownEvent[] }[] = [];
		for (const event of shown) {
			if (result.at(-1)?.key !== event.date.monthKey) {
				result.push({ key: event.date.monthKey, label: event.date.monthLabel, events: [] });
			}
			result.at(-1)!.events.push(event);
		}
		return result;
	});

	const pastYears = $derived.by(() => {
		const result: { label: string; concerts: typeof data.past }[] = [];
		for (const concert of data.past) {
			const label = concert.label?.year ?? t.concert.dateUnknown;
			if (result.at(-1)?.label !== label) result.push({ label, concerts: [] });
			result.at(-1)!.concerts.push(concert);
		}
		return result;
	});

	const filters: { value: Filter; label: string }[] = [
		{ value: 'all', label: t.concerts.filters.all },
		{ value: 'concerts', label: t.concerts.filters.concerts },
		{ value: 'rehearsals', label: t.concerts.filters.rehearsals }
	];
</script>

<Title title={t.concerts.title} />
<PageHeader title={t.concerts.title} lead={t.concerts.lead} />

{#if data.error === 'not-configured'}
	<EmptyState icon="calendar" text={t.concerts.empty} />
{:else if data.error}
	<div class="notice">
		<p>{t.concerts.failed}</p>
		<a href="/status">{t.pieces.checkStatus}</a>
	</div>
{:else}
	<div class="toolbar">
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
		<div class="views" role="radiogroup" aria-label={t.concerts.view}>
			<button class="view" class:active={view === 'list'} role="radio" aria-checked={view === 'list'} onclick={() => show('list')}>
				<Icon name="menu" size={16} />{t.concerts.list}
			</button>
			<button class="view" class:active={view === 'calendar'} role="radio" aria-checked={view === 'calendar'} onclick={() => show('calendar')}>
				<Icon name="calendar" size={16} />{t.concerts.calendar}
			</button>
		</div>
		{#if data.subscribeUrl}
			<a class="subscribe" href={data.subscribeUrl} target="_blank" rel="noopener noreferrer">
				<Icon name="calendar" size={16} />
				{t.concerts.subscribe}
			</a>
		{/if}
	</div>

	{#if view === 'calendar'}
		<CalendarView events={calendarEvents} today={data.today} concertTitles={data.concertTitles} />
	{:else}
	<h2 class="section">{t.concerts.upcoming}</h2>
	{#if months.length === 0}
		<p class="none">{t.concerts.noUpcoming}</p>
	{:else}
		{#each months as month (month.key)}
			<h3 class="month">{month.label}</h3>
			<ul class="list">
				{#each month.events as event (event.id)}
					<li class:next={event.id === next}>
						{#if event.id === next}<span class="next-label">{t.concerts.next}</span>{/if}
						<EventRow {event} concertTitle={event.concertId ? data.concertTitles[event.concertId] : undefined} />
					</li>
				{/each}
			</ul>
		{/each}
	{/if}
	{/if}

{/if}

{#if pastYears.length > 0 && filter !== 'rehearsals'}
	<!-- Folded away: the page is about what's coming. -->
	<details class="past-block">
		<summary class="section past">{t.concerts.past} <span class="past-count">{data.past.length}</span></summary>
		{#each pastYears as year (year.label)}
			<h3 class="month">{year.label}</h3>
			<ul class="list">
				{#each year.concerts as concert (concert.id)}
					<li><ConcertRow {concert} /></li>
				{/each}
			</ul>
		{/each}
	</details>
{/if}

{#if data.archive.canAdd}
	<AddToArchive kind="concert" orchestras={data.archive.orchestras} result={form} />
{/if}

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.chips {
		display: flex;
		gap: var(--space-2);
	}

	.chip {
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

	.views {
		display: inline-flex;
		padding: 3px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
	}

	.view {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: 4px 12px;
		border: 0;
		border-radius: 999px;
		background: none;
		color: var(--text-muted);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.view.active {
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
	}

	li.next {
		position: relative;
		box-shadow: inset 4px 0 0 var(--accent);
		background: color-mix(in oklab, var(--accent) 6%, transparent);
	}

	.next-label {
		position: absolute;
		top: 6px;
		right: var(--space-4);
		padding: 0 var(--space-2);
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-contrast);
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.past-block summary {
		cursor: pointer;
	}

	.past-count {
		color: var(--text-muted);
		font-family: var(--font-sans, inherit);
		font-size: 0.9375rem;
	}

	.subscribe {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--accent);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.section {
		margin: var(--space-5) 0 var(--space-2);
		font-family: var(--font-serif);
		font-size: 1.375rem;
	}

	.section.past {
		margin-top: var(--space-7);
	}

	.month {
		margin: var(--space-4) 0 var(--space-2) var(--space-1);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
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

	.none,
	.notice {
		padding: var(--space-5) var(--space-4);
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
</style>
