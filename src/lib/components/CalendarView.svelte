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

	/** A concert day is a stage; otherwise the Generalprobe, then a rehearsal, gets the sticker. */
	const RANK = { konzert: 0, generalprobe: 1, probe: 2, sonstiges: 3 } as const;
	const mainType = (events: ShownEvent[]) =>
		events.reduce<ShownEvent['type'] | null>((best, e) => (best === null || RANK[e.type] < RANK[best] ? e.type : best), null);
	/** Stuck on by hand: each sticker at its own small angle, the same on every visit. */
	const tilt = (key: string) => ((Number(key.slice(-2)) * 37 + Number(key.slice(5, 7)) * 11) % 19) - 9;

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
					{@const main = mainType(dayEvents)}
					<div
						class="day"
						class:stage={main === 'konzert'}
						class:tentative-day={dayEvents.length > 0 && dayEvents.every((e) => e.tentative)}
						class:other={!day.inMonth}
						class:today={day.key === today}
						class:selected={day.key === selected}
						class:past={day.key < today}
						role="gridcell"
					>
						<button class="number" onclick={() => (selected = day.key)} aria-pressed={day.key === selected} aria-label="{day.day}. {dayEvents.map((e) => e.displayTitle).join(', ')}">
							{day.day}
						</button>
						{#if main === 'konzert'}
							<!-- Velvet curtains and a pelmet; they part a little on hover and when picked. -->
							<span class="curtains" aria-hidden="true">
								<span class="curtain left"></span>
								<span class="curtain right"></span>
								<span class="pelmet"></span>
							</span>
						{/if}
						{#if main && main !== 'sonstiges'}
							<span class="sticker {main}" style:--tilt="{tilt(day.key)}deg" aria-hidden="true">
								<img src="/logo.png" alt="" width="40" height="40" loading="lazy" />
							</span>
						{/if}
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
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<div class="legend" aria-hidden="true">
		<span><span class="swatch stage-swatch"><span class="curtain left"></span><span class="curtain right"></span></span>{t.concerts.types.konzert}</span>
		<span><span class="sticker generalprobe mini"><img src="/logo.png" alt="" width="20" height="20" /></span>{t.concerts.types.generalprobe}</span>
		<span><span class="sticker probe mini"><img src="/logo.png" alt="" width="20" height="20" /></span>{t.concerts.types.probe}</span>
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
		/* Theatre velvet, deep enough to carry the gold of the logo. */
		--velvet: #8c1c2b;
		--velvet-dark: #5e0f1b;
		--velvet-light: #b23345;
		--fringe: #d4a937;
	}

	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .calendar {
			--velvet: #6e1522;
			--velvet-dark: #3f0a13;
			--velvet-light: #8f2535;
		}
	}

	:global(:root[data-theme='dark']) .calendar {
		--velvet: #6e1522;
		--velvet-dark: #3f0a13;
		--velvet-light: #8f2535;
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
		position: relative;
		display: grid;
		grid-template-rows: auto 1fr;
		align-content: start;
		gap: 2px;
		min-height: 104px;
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

	.day.past > .sticker,
	.day.past > .curtains,
	.day.other > .sticker,
	.day.other > .curtains {
		opacity: 0.55;
		filter: saturate(0.6);
	}

	.number {
		position: relative;
		z-index: 2;
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

	/* --- Stickers: the orchestra logo, die-cut with a white edge, stuck on at an angle. --- */
	.sticker {
		position: absolute;
		top: 6px;
		right: 6px;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		padding: 2px;
		border-radius: 50%;
		background: #fff;
		box-shadow:
			0 1px 1px rgb(0 0 0 / 0.18),
			0 3px 6px -2px rgb(0 0 0 / 0.3);
		transform: rotate(var(--tilt, -6deg));
		transition: transform 0.2s ease;
	}

	.sticker img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	/* A little shine across the sticker, like glossy vinyl. */
	.sticker::after {
		content: '';
		position: absolute;
		inset: 2px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgb(255 255 255 / 0.45), transparent 45%);
		pointer-events: none;
	}

	.sticker.generalprobe {
		box-shadow:
			0 0 0 2px var(--fringe),
			0 3px 6px -2px rgb(0 0 0 / 0.35);
	}

	.day:hover > .sticker {
		transform: rotate(calc(var(--tilt, -6deg) * -0.5)) scale(1.08);
	}

	.tentative-day > .sticker {
		opacity: 0.6;
		outline: 2px dashed var(--border);
		outline-offset: 2px;
	}

	/* --- Concert days are a stage: curtains, a pelmet, and the logo in the spotlight. --- */
	.stage {
		background: radial-gradient(ellipse at 50% 70%, color-mix(in oklab, var(--fringe) 22%, transparent), transparent 70%);
	}

	.stage > .sticker {
		top: 50%;
		left: 50%;
		right: auto;
		width: 42px;
		height: 42px;
		margin: -24px 0 0 -21px;
		box-shadow:
			0 0 0 2px var(--fringe),
			0 0 16px 2px color-mix(in oklab, var(--fringe) 45%, transparent),
			0 4px 8px -2px rgb(0 0 0 / 0.35);
	}

	.curtains {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.curtain {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 24%;
		background:
			linear-gradient(180deg, rgb(0 0 0 / 0.15), transparent 30%),
			repeating-linear-gradient(90deg, var(--velvet-dark) 0 2px, var(--velvet) 2px 6px, var(--velvet-light) 6px 8px, var(--velvet) 8px 11px);
		transition: width 0.35s ease;
	}

	/* Tied back: narrow at the tie, wider below, like a drawn theatre curtain. */
	.curtain.left {
		left: 0;
		border-bottom-right-radius: 70% 40%;
		box-shadow: inset -2px 0 3px rgb(0 0 0 / 0.25);
	}

	.curtain.right {
		right: 0;
		border-bottom-left-radius: 70% 40%;
		box-shadow: inset 2px 0 3px rgb(0 0 0 / 0.25);
	}

	/* The gold tie-backs. */
	.curtain::after {
		content: '';
		position: absolute;
		top: 58%;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--fringe);
		box-shadow: 0 1px 1px rgb(0 0 0 / 0.3);
	}

	.curtain.left::after {
		right: 1px;
	}

	.curtain.right::after {
		left: 1px;
	}

	/* The pelmet: a scalloped velvet band with a gold fringe. */
	.pelmet {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 9px;
		background:
			radial-gradient(circle at 50% 0, var(--velvet) 5px, transparent 5.5px) 0 4px / 12px 8px repeat-x,
			linear-gradient(var(--velvet-dark), var(--velvet)) 0 0 / 100% 5px no-repeat;
		border-bottom: 1px solid transparent;
	}

	.pelmet::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 4px;
		height: 2px;
		background: repeating-linear-gradient(90deg, var(--fringe) 0 2px, transparent 2px 4px);
	}

	.stage:hover .curtain,
	.stage.selected .curtain {
		width: 16%;
	}

	.stage .number {
		margin-top: 6px;
		margin-left: 20%;
		background: color-mix(in oklab, var(--surface) 85%, transparent);
	}

	.stage.today .number {
		background: var(--accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.curtain,
		.sticker {
			transition: none;
		}
	}

	/* --- Titles under the stickers (wide screens only). --- */
	.chips {
		position: relative;
		z-index: 2;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-self: end;
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
		background: color-mix(in oklab, var(--surface) 88%, var(--tone));
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
		background: color-mix(in oklab, var(--surface) 70%, var(--tone));
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

	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-5);
		margin: var(--space-3) 0 var(--space-4) var(--space-1);
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.legend > span {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.sticker.mini {
		position: relative;
		top: auto;
		right: auto;
		width: 22px;
		height: 22px;
		padding: 1px;
	}

	.swatch {
		position: relative;
		display: inline-block;
		width: 26px;
		height: 20px;
		overflow: hidden;
		border-radius: 4px;
		background: color-mix(in oklab, var(--fringe) 25%, var(--surface));
	}

	.swatch .curtain {
		width: 38%;
	}

	.swatch .curtain::after {
		display: none;
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

	/* Phones: no titles; the stickers and stages are enough, the list below shows the day. */
	@media (max-width: 640px) {
		.day {
			min-height: 58px;
			justify-items: center;
			padding: 3px 0;
		}

		.number {
			justify-self: center;
			width: 22px;
			height: 22px;
			font-size: 0.75rem;
		}

		.chips {
			display: none;
		}

		.day > .sticker {
			top: auto;
			right: auto;
			bottom: 4px;
			left: 50%;
			width: 24px;
			height: 24px;
			margin-left: -12px;
			padding: 1px;
		}

		.stage > .sticker {
			top: auto;
			bottom: 5px;
			width: 26px;
			height: 26px;
			margin: 0 0 0 -13px;
		}

		.stage .number {
			margin: 4px 0 0;
		}

		.curtain {
			width: 22%;
		}

		.curtain::after {
			width: 5px;
			height: 5px;
		}
	}
</style>
