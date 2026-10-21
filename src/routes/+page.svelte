<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Title from '#lib/components/Title.svelte';
	import { navGroups } from '#lib/nav.ts';
	import type { ShownEvent } from '#lib/events/schedule.ts';

	let { data } = $props();

	/** A few pieces as chips; the whole list is one click away on the event's page. */
	const CHIPS = 4;
	/** "Städtisches Gymnasium Bergkamen, Hubert-Biernat-Straße 1, …" → the venue's name. */
	const venue = (location: string) => location.split(',')[0].trim();
	const eventUrl = (event: ShownEvent) => `/konzerte/${encodeURIComponent(event.id)}`;

	const firstName = $derived(data.user?.name.split(' ')[0] ?? '');

	/**
	 * The hub: the next rehearsal and the next concert, whichever comes first on top.
	 * Each card has one obvious action, the member's parts for it.
	 */
	const upNext = $derived(
		[
			data.nextRehearsal && {
				kind: 'probe' as const,
				label: t.home.nextRehearsal,
				event: data.nextRehearsal,
				note: data.rehearsalFor ? t.concerts.forConcert(data.rehearsalFor) : undefined,
				piecesLabel: t.rehearsalPlan.title,
				pieces: data.rehearsing,
				partsUrl: data.rehearsalParts
			},
			data.nextConcert && {
				kind: 'konzert' as const,
				label: t.home.nextConcert,
				event: data.nextConcert,
				note: undefined,
				piecesLabel: `${t.home.program} · ${t.home.pieces(data.program.length)}`,
				pieces: data.program,
				partsUrl: data.program.length ? `/meine-noten?konzert=${encodeURIComponent(data.nextConcert.id)}` : undefined
			}
		]
			.filter((card) => !!card)
			.sort((a, b) => a.event.daysUntil - b.event.daysUntil)
	);

	// Every page by group, so the start page doubles as a map of the app. A workspace is one
	// entry, its pages named underneath; the tabs on its pages lead on from there.
	const groups = $derived(
		navGroups({ auth: data.auth, rights: data.rights }).map((group) =>
			group.workspace && group.items.length > 1
				? {
						...group,
						items: [{ ...group.items[0], label: group.label, description: group.items.map((item) => item.label).join(' · ') }]
					}
				: { ...group, items: group.items.map((item) => ({ ...item, description: t.home.describe[item.href] })) }
		)
	);
	// The workspaces share one heading, so the map stays short.
	const work = $derived(groups.filter((group) => group.workspace));
	const sections = $derived([
		...groups.filter((group) => !group.workspace),
		...(work.length ? [{ key: 'arbeit', label: t.home.work, items: work.flatMap((group) => group.items) }] : [])
	]);
	const todo = $derived(
		data.todo
			? [
					{ href: '/meldungen', count: data.todo.reports, text: t.home.todo.reports },
					{ href: '/wuensche', count: data.todo.wishes, text: t.home.todo.wishes },
					{ href: '/admin', count: data.todo.requests, text: t.home.todo.requests },
					{ href: '/leihmaterial', count: data.todo.loans, text: t.home.todo.loans },
					{ href: data.todo.attendanceUrl ?? '/konzerte', count: data.todo.attendance, text: t.home.todo.attendance }
				].filter((item) => item.count > 0)
			: []
	);
</script>

<Title />

<header class="hero">
	<p class="eyebrow">{data.orchestraName}</p>
	<h1>{firstName ? t.home.hello(firstName) : t.home.title(data.orchestraName)}</h1>
</header>

{#if todo.length}
	<section class="todo" aria-label={t.home.todo.title}>
		<span class="ui-label">{t.home.todo.title}</span>
		<ul>
			{#each todo as item (item.href)}
				<li><a href={item.href}><strong>{item.count}</strong> {item.text(item.count)}<Icon name="chevron" size={16} /></a></li>
			{/each}
		</ul>
	</section>
{/if}

<section class="up-next" aria-label={t.home.upNext}>
	{#each upNext as card (card.kind)}
		<article class="ui-card next {card.kind}">
			<div class="next-head">
				<span class="ui-label">{card.label}</span>
				<span class="countdown">{t.concerts.relative(card.event.daysUntil)}</span>
			</div>
			<a class="event" href={eventUrl(card.event)}>
				<span class="date" aria-hidden="true">
					<span class="weekday">{card.event.date.weekday}</span>
					<span class="day">{card.event.date.day}</span>
					<span class="month">{card.event.date.month}</span>
				</span>
				<span class="event-body">
					<strong>{card.event.displayTitle}</strong>
					<span>{card.event.date.time || t.concerts.allDay}{card.note ? ` · ${card.note}` : ''}</span>
					{#if card.event.location}<span class="venue" title={card.event.location}>{venue(card.event.location)}</span>{/if}
				</span>
				<span class="chevron"><Icon name="chevron" size={18} /></span>
			</a>
			{#if card.pieces.length}
				<div class="pieces">
					<span class="pieces-label">{card.piecesLabel}</span>
					<ul class="chips">
						{#each card.pieces.slice(0, CHIPS) as item, i (i)}
							<li>
								{#if item.pieceId}
									<a class="chip" href="/stuecke/{encodeURIComponent(item.pieceId)}">{item.title}</a>
								{:else}
									<span class="chip">{item.title}</span>
								{/if}
							</li>
						{/each}
						{#if card.pieces.length > CHIPS}
							<li><a class="chip more" href={eventUrl(card.event)}>{t.home.morePieces(card.pieces.length - CHIPS)}</a></li>
						{/if}
					</ul>
				</div>
			{/if}
			<div class="actions">
				{#if card.partsUrl}
					<a class="btn" href={card.partsUrl}><Icon name="user" size={16} />{t.nav.myParts}</a>
				{/if}
				<a class="btn ghost" href={eventUrl(card.event)}>{t.home.details}</a>
			</div>
		</article>
	{:else}
		<div class="ui-card empty">
			<span class="empty-icon"><Icon name="calendar" size={22} /></span>
			<p>{data.calendar === 'ok' ? t.home.noNextConcert : t.home.nextConcertEmpty}</p>
			<a class="btn ghost" href="/konzerte">{t.home.allDates}</a>
		</div>
	{/each}
</section>

<h2 class="section-title">{t.home.quickLinks}</h2>
<div class="groups">
	{#each sections as group (group.key)}
		<section>
			<h3 class="ui-label">{group.label}</h3>
			<ul class="ui-list">
				{#each group.items as item (item.href)}
					<li>
						<a href={item.href} class="row">
							<span class="row-icon"><Icon name={item.icon} size={18} /></span>
							<span class="row-body">
								<strong>{item.label}</strong>
								{#if item.description}<span>{item.description}</span>{/if}
							</span>
							<span class="chevron"><Icon name="chevron" size={18} /></span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.hero {
		display: grid;
		gap: var(--space-1);
		margin-bottom: var(--space-6);
	}

	.eyebrow {
		color: var(--accent);
		font-size: 0.8125rem;
		font-weight: 650;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	.todo {
		margin-bottom: var(--space-5);
	}

	.todo ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.todo a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 40px;
		padding: 0 var(--space-3) 0 var(--space-4);
		border-radius: 999px;
		background: color-mix(in oklab, var(--warn) 10%, var(--surface));
		font-size: 0.9375rem;
		transition: background var(--fast) var(--ease);
	}

	.todo a:hover {
		background: color-mix(in oklab, var(--warn) 18%, var(--surface));
	}

	.todo strong {
		color: var(--warn);
	}

	/* On phones the pills would stack one per line; one grouped card with rows reads calmer. */
	@media (max-width: 640px) {
		.todo ul {
			display: grid;
			gap: 0;
			overflow: hidden;
			border-radius: var(--radius-m);
			background: var(--surface);
			box-shadow: 0 0 0 1px var(--border);
		}

		.todo li + li {
			border-top: 1px solid var(--border);
		}

		.todo a {
			display: flex;
			min-height: var(--tap);
			padding: 0 var(--space-4);
			border-radius: 0;
			background: none;
		}

		.todo a:hover {
			background: var(--surface-2);
		}

		.todo strong {
			display: grid;
			place-items: center;
			min-width: 24px;
			height: 24px;
			padding: 0 6px;
			border-radius: 999px;
			background: color-mix(in oklab, var(--warn) 16%, transparent);
			font-size: 0.8125rem;
		}

		.todo a :global(svg) {
			margin-left: auto;
			color: var(--text-muted);
		}
	}

	.up-next {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
		gap: var(--space-4);
		margin-bottom: var(--space-7);
	}

	.next {
		display: grid;
		align-content: start;
		gap: var(--space-4);
	}

	/* The concert is the goal: a little warmth from the accent. */
	.next.konzert {
		background:
			radial-gradient(120% 120% at 100% 0%, var(--accent-soft), transparent 55%),
			var(--surface);
	}

	.next-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.next-head .ui-label {
		margin: 0;
	}

	.countdown {
		padding: 2px 10px;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.konzert .countdown {
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.event {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.date {
		display: grid;
		justify-items: center;
		flex: none;
		width: 60px;
		padding: var(--space-2) 0;
		border-radius: 14px;
		background: var(--surface-2);
		color: var(--text);
		line-height: 1.1;
	}

	.konzert .date {
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.weekday,
	.month {
		font-size: 0.6875rem;
		font-weight: 650;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.day {
		font-size: 1.625rem;
		font-weight: 700;
	}

	.event-body {
		display: grid;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.event-body strong {
		font-family: var(--font-serif);
		font-size: 1.3125rem;
		font-weight: 600;
		line-height: 1.25;
	}

	.event-body span {
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.venue {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chevron {
		display: grid;
		flex: none;
		color: var(--text-muted);
		transition:
			transform var(--fast) var(--ease),
			color var(--fast) var(--ease);
	}

	.event:hover .chevron,
	.row:hover .chevron {
		transform: translateX(2px);
		color: var(--accent);
	}

	.pieces {
		display: grid;
		gap: var(--space-2);
	}

	.pieces-label {
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.chip {
		display: inline-block;
		max-width: 100%;
		padding: 5px 12px;
		overflow: hidden;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--text);
		font-size: 0.875rem;
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

	.chip.more {
		background: none;
		color: var(--text-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-1);
	}

	.empty {
		display: grid;
		justify-items: start;
		gap: var(--space-3);
		color: var(--text-muted);
	}

	.empty-icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: var(--accent-soft);
		color: var(--accent);
	}

	.section-title {
		margin-bottom: var(--space-4);
		font-family: var(--font-serif);
		font-size: 1.375rem;
	}

	.groups {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
		gap: var(--space-5) var(--space-4);
		align-items: start;
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 60px;
		padding: var(--space-3) var(--space-4);
		transition: background var(--fast) var(--ease);
	}

	.row:hover {
		background: var(--surface-2);
	}

	.row-icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		background: var(--accent-soft);
		color: var(--accent);
	}

	.row-body {
		display: grid;
		flex: 1;
		min-width: 0;
		line-height: 1.35;
	}

	.row-body strong {
		font-weight: 600;
	}

	.row-body span {
		color: var(--text-muted);
		font-size: 0.875rem;
	}
</style>
