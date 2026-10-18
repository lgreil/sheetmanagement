<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data } = $props();

	const links: { href: string; label: string; text: string; icon: IconName }[] = [
		{ href: '/stuecke', label: t.nav.pieces, text: t.pieces.lead, icon: 'music' },
		{ href: '/konzerte', label: t.nav.concerts, text: t.concerts.lead, icon: 'calendar' },
		{ href: '/meine-noten', label: t.nav.myParts, text: t.myParts.lead, icon: 'user' }
	];
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

<h2 class="section-title">{t.home.quickLinks}</h2>
<div class="grid">
	{#each links as link (link.href)}
		<a href={link.href} class="card">
			<span class="card-icon"><Icon name={link.icon} /></span>
			<span class="card-body">
				<strong>{link.label}</strong>
				<span>{link.text}</span>
			</span>
			<span class="card-arrow"><Icon name="arrow" size={18} /></span>
		</a>
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

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: var(--space-3);
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
