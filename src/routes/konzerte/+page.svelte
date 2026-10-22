<script lang="ts">
	import { page } from '$app/state';
	import { t } from '#lib/i18n/index.ts';
	import type { ShownEvent } from '#lib/events/schedule.ts';
	import AddToArchive from '#lib/components/AddToArchive.svelte';
	import CalendarView from '#lib/components/CalendarView.svelte';
	import ConcertRow from '#lib/components/ConcertRow.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import EventRow from '#lib/components/EventRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Segmented from '#lib/components/Segmented.svelte';
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
	const views = [
		{ value: 'list' as const, label: t.concerts.list, icon: 'menu' as const },
		{ value: 'calendar' as const, label: t.concerts.calendar, icon: 'calendar' as const }
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
	<!-- One row: what to show on the left, how to show it on the right. -->
	<div class="toolbar">
		<Segmented options={filters} bind:value={filter} label="Filter" />
		<Segmented options={views} value={view} label={t.concerts.view} iconOnly onchange={show} />
	</div>

	{#if view === 'calendar'}
		<CalendarView events={calendarEvents} today={data.today} concertTitles={data.concertTitles} />
	{:else}
	{#if months.length === 0}
		<p class="none">{t.concerts.noUpcoming}</p>
	{:else}
		{#each months as month (month.key)}
			<h2 class="ui-label month">{month.label}</h2>
			<ul class="ui-list">
				{#each month.events as event (event.id)}
					<li class:next={event.id === next}>
						<EventRow
							{event}
							concertTitle={event.concertId ? data.concertTitles[event.concertId] : undefined}
							badge={event.id === next ? t.concerts.next : undefined}
						/>
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
			<h3 class="ui-label month">{year.label}</h3>
			<ul class="ui-list">
				{#each year.concerts as concert (concert.id)}
					<li><ConcertRow {concert} /></li>
				{/each}
			</ul>
		{/each}
	</details>
{/if}

{#if data.subscribeUrl && !data.error}
	<div class="ui-actions subscribe">
		<!-- Signed in: the personal feed with own answers and the plan first (#122); the shared calendar stays. -->
		{#if page.data.user}<a href="/profil#kalender"><Icon name="calendar" size={16} />{t.concerts.ownCalendar}</a>{/if}
		<a href={data.subscribeUrl} target="_blank" rel="noopener noreferrer"><Icon name="external" size={16} />{t.concerts.subscribe}</a>
	</div>
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
		margin-bottom: var(--space-5);
	}

	li.next {
		background: color-mix(in oklab, var(--accent) 6%, transparent);
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
		justify-content: center;
		margin-top: var(--space-6);
	}

	.section {
		margin: var(--space-5) 0 var(--space-2);
		font-family: var(--font-display);
		font-size: 1.375rem;
	}

	.section.past {
		margin-top: var(--space-7);
	}

	.month {
		margin-top: var(--space-5);
	}

	.month:first-of-type {
		margin-top: 0;
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
