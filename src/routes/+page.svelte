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
	</div>
	<p>{t.home.nextConcertEmpty}</p>
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
