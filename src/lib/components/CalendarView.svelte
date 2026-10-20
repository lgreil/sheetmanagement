<script lang="ts">
	import { config } from '#lib/config/index.ts';
	import { addMonths, eventDayKey, monthGrid } from '#lib/events/calendar.ts';
	import { dateFormat } from '#lib/events/format.ts';
	import type { ShownEvent } from '#lib/events/schedule.ts';
	import { t } from '#lib/i18n/index.ts';
	import EventRow from './EventRow.svelte';
	import Icon from './Icon.svelte';

	/**
	 * A month grid of rehearsals and concerts. On wide screens the days show the titles;
	 * on phones coloured dots, and the picked day's events are listed below the grid.
	 */
	let {
		events,
		today,
		concertTitles
	}: { events: ShownEvent[]; today: string; concertTitles: Record<string, string> } = $props();

	const byDay = $derived.by(() => {
		const map = new Map<string, ShownEvent[]>();
		for (const event of events) {
			const key = eventDayKey(event.date);
			map.set(key, [...(map.get(key) ?? []), event]);
		}
		return map;
	});

	// svelte-ignore state_referenced_locally
	let month = $state(today.slice(0, 7));
	// svelte-ignore state_referenced_locally
	let selected = $state(today);
	const weeks = $derived(monthGrid(month));
	const label = $derived(dateFormat(config.locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`)));
	const weekdays = $derived(
		Array.from({ length: 7 }, (_, i) => dateFormat(config.locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i))))
	);
	const selectedEvents = $derived(byDay.get(selected) ?? []);
	const selectedLabel = $derived(
		dateFormat(config.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${selected}T00:00:00Z`))
	);

	function go(step: number) {
		month = addMonths(month, step);
		// The first day with an event, else the 1st, so the list below isn't from another month.
		const first = monthGrid(month)
			.flat()
			.find((day) => day.inMonth && byDay.has(day.key));
		selected = first?.key ?? (today.startsWith(month) ? today : `${month}-01`);
	}
</script>

<div class="calendar">
	<div class="head">
		<button class="nav" onclick={() => go(-1)} aria-label={t.concerts.previousMonth}><Icon name="back" size={18} /></button>
		<h3 aria-live="polite">{label}</h3>
		<button class="nav next" onclick={() => go(1)} aria-label={t.concerts.nextMonth}><Icon name="back" size={18} /></button>
		{#if !today.startsWith(month)}
			<button class="to-today" onclick={() => ((month = today.slice(0, 7)), (selected = today))}>{t.concerts.today}</button>
		{/if}
	</div>

	<div class="grid" role="grid" aria-label={label}>
		<div class="row weekdays" role="row">
			{#each weekdays as weekday (weekday)}<span role="columnheader">{weekday}</span>{/each}
		</div>
		{#each weeks as week (week[0].key)}
			<div class="row" role="row">
				{#each week as day (day.key)}
					{@const dayEvents = byDay.get(day.key) ?? []}
					<div
						class="day"
						class:other={!day.inMonth}
						class:today={day.key === today}
						class:selected={day.key === selected}
						class:past={day.key < today}
						role="gridcell"
					>
						<button class="number" onclick={() => (selected = day.key)} aria-pressed={day.key === selected} aria-label="{day.day}. {dayEvents.map((e) => e.displayTitle).join(', ')}">
							{day.day}
						</button>
						{#if dayEvents.length}
							<ul class="chips">
								{#each dayEvents.slice(0, 3) as event (event.id)}
									<li>
										<a class="chip {event.type}" class:tentative={event.tentative} href="/konzerte/{encodeURIComponent(event.id)}" title={event.displayTitle}>
											{event.date.time ? `${event.date.time.split(' ')[0]} ` : ''}{event.displayTitle}
										</a>
									</li>
								{/each}
								{#if dayEvents.length > 3}<li class="more">+{dayEvents.length - 3}</li>{/if}
							</ul>
							<span class="dots" aria-hidden="true">
								{#each dayEvents.slice(0, 3) as event (event.id)}<span class="dot {event.type}"></span>{/each}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<div class="legend" aria-hidden="true">
		{#each ['konzert', 'generalprobe', 'probe'] as const as type (type)}
			<span><span class="dot {type}"></span>{t.concerts.types[type]}</span>
		{/each}
	</div>

	<div class="selected">
		<h4>{selectedLabel}</h4>
		{#if selectedEvents.length}
			<ul class="list">
				{#each selectedEvents as event (event.id)}
					<li><EventRow {event} concertTitle={event.concertId ? concertTitles[event.concertId] : undefined} /></li>
				{/each}
			</ul>
		{:else}
			<p class="none">{t.concerts.noEventsThatDay}</p>
		{/if}
	</div>
</div>

<style>
	.calendar {
		--konzert: var(--accent);
		--generalprobe: var(--warn);
		--probe: color-mix(in oklab, var(--ok) 80%, var(--text));
		--sonstiges: var(--text-muted);
	}

	.head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.head h3 {
		min-width: 10em;
		margin: 0;
		font-family: var(--font-serif);
		font-size: 1.25rem;
		text-align: center;
	}

	.nav,
	.to-today {
		display: grid;
		place-items: center;
		height: 36px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.nav {
		width: 36px;
	}

	.nav.next :global(svg) {
		transform: rotate(180deg);
	}

	.to-today {
		margin-left: auto;
		padding: 0 var(--space-3);
	}

	.grid {
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.row {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}

	.row + .row {
		border-top: 1px solid var(--border);
	}

	.weekdays span {
		padding: var(--space-2) 0;
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		text-align: center;
		text-transform: uppercase;
	}

	.day {
		display: grid;
		align-content: start;
		gap: 2px;
		min-height: 96px;
		padding: 4px;
		min-width: 0;
		overflow: hidden;
	}

	.day + .day {
		border-left: 1px solid var(--border);
	}

	.day.other {
		background: color-mix(in oklab, var(--surface-2) 50%, transparent);
	}

	.day.other .number,
	.day.past .number {
		color: var(--text-muted);
	}

	.day.selected {
		background: var(--accent-soft);
	}

	.number {
		justify-self: start;
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border: 0;
		border-radius: 999px;
		background: none;
		color: var(--text);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
	}

	.day.today .number {
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.chips {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.chip {
		display: block;
		overflow: hidden;
		padding: 1px 4px;
		border-left: 3px solid var(--tone);
		border-radius: 4px;
		background: color-mix(in oklab, var(--tone) 12%, transparent);
		color: var(--text);
		font-size: 0.6875rem;
		line-height: 1.4;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chip.tentative {
		border-left-style: dashed;
	}

	.chip:hover {
		background: color-mix(in oklab, var(--tone) 22%, transparent);
	}

	.konzert {
		--tone: var(--konzert);
	}

	.generalprobe {
		--tone: var(--generalprobe);
	}

	.probe {
		--tone: var(--probe);
	}

	.sonstiges {
		--tone: var(--sonstiges);
	}

	.more {
		color: var(--text-muted);
		font-size: 0.6875rem;
	}

	.dots {
		display: none;
		gap: 3px;
		justify-content: center;
	}

	.dot {
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--tone);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-4);
		margin: var(--space-2) 0 var(--space-4) var(--space-1);
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.legend > span {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.selected h4 {
		margin: 0 0 var(--space-2) var(--space-1);
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

	.none {
		margin: 0 0 0 var(--space-1);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	/* Phones: dots instead of titles; the list below the grid shows the day. */
	@media (max-width: 640px) {
		.day {
			min-height: 52px;
			justify-items: center;
			padding: 4px 0;
		}

		.number {
			justify-self: center;
		}

		.chips {
			display: none;
		}

		.dots {
			display: flex;
		}
	}
</style>
