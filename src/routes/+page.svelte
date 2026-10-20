<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Title from '#lib/components/Title.svelte';
	import { navGroups } from '#lib/nav.ts';

	let { data } = $props();

	// Every page by group, so the start page doubles as a map of the app.
	const groups = $derived(navGroups({ auth: data.auth, rights: data.rights }));
	const todo = $derived(
		data.todo
			? [
					{ href: '/meldungen', count: data.todo.reports, text: t.home.todo.reports },
					{ href: '/wuensche', count: data.todo.wishes, text: t.home.todo.wishes },
					{ href: '/admin', count: data.todo.requests, text: t.home.todo.requests }
				].filter((item) => item.count > 0)
			: []
	);
</script>

<Title />

<section class="hero">
	<p class="eyebrow">{t.home.greeting}</p>
	<h1>{data.orchestraName}</h1>
	<p class="intro">{t.home.intro}</p>
</section>

<section class="next">
	<div class="next-head">
		<Icon name="sparkle" size={18} />
		<h2>{t.home.nextConcert}</h2>
		{#if data.nextConcert}<span class="countdown">{t.concerts.relative(data.nextConcert.daysUntil)}</span>{/if}
	</div>
	{#if data.nextConcert}
		{@const concert = data.nextConcert}
		<a class="concert" href="/konzerte/{encodeURIComponent(concert.id)}">
			<span class="concert-date">
				<span class="day">{concert.date.day}</span>
				<span class="month">{concert.date.month}</span>
			</span>
			<span class="concert-body">
				<strong>{concert.displayTitle}</strong>
				<span>{concert.date.long}{concert.date.time ? `, ${concert.date.time}` : ''}</span>
				{#if concert.location}<span>{concert.location}</span>{/if}
				{#if data.program.length}<span class="program">{t.home.program}: {data.program.join(' · ')}</span>{/if}
			</span>
			<span class="card-arrow"><Icon name="arrow" size={18} /></span>
		</a>
		<a class="btn my-parts" href="/meine-noten?konzert={encodeURIComponent(concert.id)}">
			<Icon name="user" size={18} />{t.myParts.forConcert(concert.displayTitle)}
		</a>
		{#if data.nextRehearsal}
			{@const rehearsal = data.nextRehearsal}
			<a class="rehearsal" href="/konzerte/{encodeURIComponent(rehearsal.id)}">
				<span class="label">{t.home.nextRehearsal}</span>
				<span>
					{rehearsal.date.weekday}, {rehearsal.date.day}. {rehearsal.date.month}
					{rehearsal.date.time ? `· ${rehearsal.date.time}` : ''}
					· {t.concerts.relative(rehearsal.daysUntil)}
				</span>
			</a>
		{/if}
	{:else}
		<p>{data.calendar === 'ok' ? t.home.noNextConcert : t.home.nextConcertEmpty}</p>
	{/if}
</section>

{#if todo.length}
	<section class="todo" aria-label={t.home.todo.title}>
		<h2 class="section-title">{t.home.todo.title}</h2>
		<ul>
			{#each todo as item (item.href)}
				<li><a href={item.href}><strong>{item.count}</strong> {item.text(item.count)}<Icon name="arrow" size={16} /></a></li>
			{/each}
		</ul>
	</section>
{/if}

<h2 class="section-title">{t.home.quickLinks}</h2>
<div class="groups">
	{#each groups as group (group.key)}
		<section class="group">
			<h3>{group.label}</h3>
			{#each group.items as item (item.href)}
				<a href={item.href} class="card">
					<span class="card-icon"><Icon name={item.icon} /></span>
					<span class="card-body">
						<strong>{item.label}</strong>
						{#if t.home.describe[item.href]}<span>{t.home.describe[item.href]}</span>{/if}
					</span>
					<span class="card-arrow"><Icon name="arrow" size={18} /></span>
				</a>
			{/each}
		</section>
	{/each}
</div>

<style>
	.hero {
		display: grid;
		gap: var(--space-3);
		margin-bottom: var(--space-6);
	}

	.eyebrow {
		color: var(--accent);
		font-weight: 600;
		font-size: 0.875rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.intro {
		max-width: 56ch;
		color: var(--text-muted);
		font-size: 1.0625rem;
	}

	.next {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-5);
		margin-bottom: var(--space-6);
		border-radius: var(--radius-l);
		background:
			radial-gradient(120% 140% at 100% 0%, var(--accent-soft), transparent 60%),
			var(--surface);
		border: 1px solid var(--border);
		box-shadow: var(--shadow);
	}

	.next-head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--accent);
	}

	.next-head h2 {
		color: var(--text);
	}

	.next p {
		color: var(--text-muted);
	}

	.countdown {
		margin-left: auto;
		padding: 2px 10px;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-contrast);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.concert {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin-top: var(--space-2);
	}

	.concert-date {
		display: grid;
		justify-items: center;
		flex: none;
		width: 64px;
		padding: var(--space-2) 0;
		border-radius: 14px;
		background: var(--accent);
		color: var(--accent-contrast);
		line-height: 1.1;
	}

	.concert-date .day {
		font-size: 1.75rem;
		font-weight: 700;
	}

	.concert-date .month {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.concert-body {
		display: grid;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.concert-body strong {
		font-family: var(--font-serif);
		font-size: 1.375rem;
		font-weight: 600;
	}

	.concert-body span {
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.concert-body .program {
		margin-top: var(--space-1);
		color: var(--text);
		overflow-wrap: anywhere;
	}

	.concert:hover .card-arrow {
		transform: translateX(3px);
		color: var(--accent);
	}

	.rehearsal {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2);
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.rehearsal .label {
		color: var(--text);
		font-weight: 600;
	}

	.rehearsal:hover {
		color: var(--text);
	}

	.section-title {
		margin-bottom: var(--space-3);
	}

	.my-parts {
		justify-self: start;
		margin-top: var(--space-3);
	}

	.todo {
		margin-bottom: var(--space-6);
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
		padding: var(--space-2) var(--space-4);
		border: 1px solid color-mix(in oklab, var(--warn) 35%, var(--border));
		border-radius: 999px;
		background: color-mix(in oklab, var(--warn) 8%, var(--surface));
		font-size: 0.9375rem;
	}

	.todo a:hover {
		border-color: var(--warn);
	}

	.todo strong {
		color: var(--warn);
	}

	.groups {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--space-5) var(--space-4);
	}

	.group {
		display: grid;
		align-content: start;
		gap: var(--space-2);
	}

	.group h3 {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.card {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		transition:
			border-color 0.15s,
			transform 0.15s,
			box-shadow 0.15s;
	}

	.card:hover {
		border-color: color-mix(in oklab, var(--accent) 40%, var(--border));
		box-shadow: var(--shadow);
		transform: translateY(-1px);
	}

	.card-icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: var(--accent-soft);
		color: var(--accent);
	}

	.card-body {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.card-body span {
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.card-arrow {
		margin-left: auto;
		color: var(--text-muted);
		transition: transform 0.15s;
	}

	.card:hover .card-arrow {
		transform: translateX(3px);
		color: var(--accent);
	}
</style>
