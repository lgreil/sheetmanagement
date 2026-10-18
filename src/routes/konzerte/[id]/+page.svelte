<script lang="ts">
	import { page } from '$app/state';
	import { t } from '#lib/i18n/index.ts';
	import EventRow from '#lib/components/EventRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import InstrumentationMatrix from '#lib/components/InstrumentationMatrix.svelte';
	import ProgramList from '#lib/components/ProgramList.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data } = $props();
	const title = $derived(data.kind === 'event' ? data.event.displayTitle : data.archive.title);
	const location = $derived(data.kind === 'event' ? data.event.location : data.archive.location);
	const isConcert = $derived(data.kind === 'archive' || data.event.type === 'konzert');
</script>

<Title {title} />

<a class="back" href="/konzerte"><Icon name="back" size={18} />{t.concert.back}</a>

{#if data.kind === 'event'}
	{@const event = data.event}
	<header class="head {event.type}">
		<p class="eyebrow">
			{t.concerts.types[event.type]}
			{#if event.tentative}<span class="tentative">{t.concerts.tentative}</span>{/if}
		</p>
		<h1>{event.displayTitle}</h1>
		{#if !event.past}<p class="relative">{t.concerts.relative(event.daysUntil)}</p>{/if}
	</header>
{:else}
	<header class="head konzert">
		<p class="eyebrow">{t.concert.archive}</p>
		<h1>{data.archive.title}</h1>
	</header>
{/if}

<div class="facts">
	<div class="fact">
		<span class="icon"><Icon name="calendar" size={18} /></span>
		<div>
			<p class="label">{t.concert.when}</p>
			{#if data.kind === 'event'}
				<p>{data.event.date.long}</p>
				<p class="muted">{data.event.date.time || t.concerts.allDay}</p>
			{:else}
				<p>{data.archive.label?.long ?? (data.archive.dateText || t.concert.dateUnknown)}</p>
			{/if}
		</div>
	</div>
	{#if location}
		<div class="fact">
			<span class="icon"><Icon name="home" size={18} /></span>
			<div>
				<p class="label">{t.concert.where}</p>
				<p>{location}</p>
				{#if data.mapUrl}
					<a class="link" href={data.mapUrl} target="_blank" rel="noopener noreferrer">{t.concert.map}</a>
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if data.kind === 'event' && data.event.description}
	<section class="block">
		<h2>{t.concert.description}</h2>
		<p class="description">{data.event.description}</p>
	</section>
{/if}

{#if isConcert}
	<section class="block">
		<div class="block-head">
			<h2>{t.concert.program}</h2>
			{#if data.program.items.length}
				<a class="edit print" href="/konzerte/{encodeURIComponent(page.params.id ?? '')}/drucken">
					<Icon name="file" size={16} />{t.print.link}
				</a>
			{/if}
			{#if data.program.canEdit}
				<a class="edit" href="/konzerte/{encodeURIComponent(page.params.id ?? '')}/programm">
					<Icon name="file" size={16} />{t.editor.edit}
				</a>
			{/if}
		</div>
		{#if data.program.saved}<p class="saved" role="status"><Icon name="check" size={16} />{t.editor.saved}</p>{/if}
		{#if data.program.items.length}
			<ProgramList items={data.program.items} />
			{#if data.kind === 'event' && !data.event.past}
				<a class="btn my-parts" href="/meine-noten?konzert={encodeURIComponent(page.params.id ?? '')}">
					<Icon name="user" size={16} />{t.myParts.forConcert(title)}
				</a>
			{/if}
			<p class="hint">{t.concert.programHint}</p>
		{:else}
			<p class="placeholder">{data.program.sheet === 'ok' ? t.concert.programEmpty : t.concert.programNoSheet}</p>
		{/if}
	</section>
{/if}

{#if isConcert && data.program.instrumentation}
	<InstrumentationMatrix {...data.program.instrumentation} />
{/if}

{#if data.kind === 'event'}
	{#if isConcert}
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

	{#if data.event.url}
		<a class="calendar" href={data.event.url} target="_blank" rel="noopener noreferrer">
			<Icon name="external" size={16} />
			{t.concert.openInCalendar}
		</a>
	{/if}
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

	.hint {
		margin: var(--space-2) var(--space-1) 0;
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.block-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.my-parts {
		justify-self: start;
		margin-top: var(--space-3);
	}

	.print {
		margin-left: auto;
	}

	.print + .edit {
		margin-left: var(--space-3);
	}

	.edit {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--accent);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.saved {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-m);
		background: color-mix(in oklab, var(--ok) 12%, transparent);
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
