<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import EventRow from '#lib/components/EventRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data } = $props();
	const event = $derived(data.event);
	const isConcert = $derived(event.type === 'konzert');
</script>

<Title title={event.displayTitle} />

<a class="back" href="/konzerte"><Icon name="back" size={18} />{t.concert.back}</a>

<header class="head {event.type}">
	<p class="eyebrow">
		{t.concerts.types[event.type]}
		{#if event.tentative}<span class="tentative">{t.concerts.tentative}</span>{/if}
	</p>
	<h1>{event.displayTitle}</h1>
	{#if !event.past}<p class="relative">{t.concerts.relative(event.daysUntil)}</p>{/if}
</header>

<div class="facts">
	<div class="fact">
		<span class="icon"><Icon name="calendar" size={18} /></span>
		<div>
			<p class="label">{t.concert.when}</p>
			<p>{event.date.long}</p>
			<p class="muted">{event.date.time || t.concerts.allDay}</p>
		</div>
	</div>
	{#if event.location}
		<div class="fact">
			<span class="icon"><Icon name="home" size={18} /></span>
			<div>
				<p class="label">{t.concert.where}</p>
				<p>{event.location}</p>
				{#if data.mapUrl}
					<a class="link" href={data.mapUrl} target="_blank" rel="noopener noreferrer">{t.concert.map}</a>
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if event.description}
	<section class="block">
		<h2>{t.concert.description}</h2>
		<p class="description">{event.description}</p>
	</section>
{/if}

{#if isConcert}
	<section class="block">
		<h2>{t.concert.program}</h2>
		<p class="placeholder">{t.concert.programSoon}</p>
	</section>

	<section class="block">
		<h2>{t.concert.rehearsals}</h2>
		{#if data.rehearsals.length}
			<ul class="list">
				{#each data.rehearsals as rehearsal (rehearsal.id)}
					<li><EventRow event={rehearsal} /></li>
				{/each}
			</ul>
		{:else}
			<p class="placeholder">{t.concert.noRehearsals}</p>
		{/if}
	</section>
{:else if data.concert}
	<section class="block">
		<h2>{t.concert.preparesFor}</h2>
		<ul class="list">
			<li><EventRow event={data.concert} /></li>
		</ul>
	</section>
{/if}

{#if event.url}
	<a class="calendar" href={event.url} target="_blank" rel="noopener noreferrer">
		<Icon name="external" size={16} />
		{t.concert.openInCalendar}
	</a>
{/if}

<style>
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
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.06em;
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
		font-size: 1.0625rem;
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}

	.fact {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
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

	.label {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.muted {
		color: var(--text-muted);
	}

	.link {
		color: var(--accent);
		font-weight: 600;
		font-size: 0.875rem;
	}

	.block {
		margin-bottom: var(--space-5);
	}

	.block h2 {
		margin: 0 0 var(--space-2) var(--space-1);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.description {
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		white-space: pre-line;
		overflow-wrap: anywhere;
	}

	.placeholder {
		padding: var(--space-4);
		border: 1px dashed var(--border);
		border-radius: var(--radius-m);
		color: var(--text-muted);
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

	.calendar {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--accent);
		font-weight: 600;
		font-size: 0.875rem;
	}
</style>
