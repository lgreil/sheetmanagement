<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import type { ShownEvent } from '#lib/events/schedule.ts';
	import Icon from './Icon.svelte';

	let {
		event,
		concertTitle,
		showRelative = true
	}: { event: ShownEvent; concertTitle?: string; showRelative?: boolean } = $props();
</script>

<a class="row {event.type}" class:past={event.past && showRelative} href="/konzerte/{encodeURIComponent(event.id)}">
	<span class="date" aria-hidden="true">
		<span class="weekday">{event.date.weekday}</span>
		<span class="day">{event.date.day}</span>
		<span class="month">{event.date.month}</span>
	</span>
	<span class="body">
		<span class="top">
			<span class="type">{t.concerts.types[event.type]}</span>
			{#if event.tentative}<span class="tentative">{t.concerts.tentative}</span>{/if}
			{#if showRelative && !event.past}<span class="relative">{t.concerts.relative(event.daysUntil)}</span>{/if}
		</span>
		<span class="title">{event.displayTitle}</span>
		<span class="meta">
			<span class="sr">{event.date.long}</span>
			{event.date.time || t.concerts.allDay}
			{#if event.location}· {event.location}{/if}
			{#if concertTitle && event.type !== 'konzert'}· {t.concerts.forConcert(concertTitle)}{/if}
		</span>
	</span>
	<span class="chevron"><Icon name="chevron" size={18} /></span>
</a>

<style>
	.row {
		--tone: var(--text-muted);
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		transition: background 0.12s;
	}

	.row:hover {
		background: var(--surface-2);
	}

	/* A past rehearsal in a list of upcoming ones. */
	.row.past {
		opacity: 0.55;
	}

	.row.konzert {
		--tone: var(--accent);
	}

	.row.generalprobe {
		--tone: var(--warn);
	}

	.date {
		display: grid;
		justify-items: center;
		flex: none;
		width: 52px;
		padding: var(--space-1) 0;
		border-radius: 12px;
		background: color-mix(in oklab, var(--tone) 12%, transparent);
		color: var(--tone);
		line-height: 1.1;
	}

	.row.konzert .date {
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.weekday,
	.month {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.day {
		font-size: 1.375rem;
		font-weight: 700;
	}

	.body {
		display: grid;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.type {
		color: var(--tone);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.tentative {
		padding: 0 6px;
		border-radius: 6px;
		background: color-mix(in oklab, var(--warn) 14%, transparent);
		color: var(--warn);
	}

	.relative {
		color: var(--text-muted);
		font-weight: 500;
	}

	.title {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.row.konzert .title {
		font-size: 1.0625rem;
	}

	.meta {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}

	.chevron {
		display: grid;
		flex: none;
		color: var(--text-muted);
		transition: transform 0.15s;
	}

	.row:hover .chevron {
		transform: translateX(2px);
		color: var(--accent);
	}
</style>
