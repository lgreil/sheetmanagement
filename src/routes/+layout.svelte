<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { config } from '#lib/config/index.ts';
	import { t } from '#lib/i18n/index.ts';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';

	let { data, children } = $props();

	const nav: { href: string; label: string; icon: IconName }[] = $derived([
		{ href: '/', label: t.nav.home, icon: 'home' },
		{ href: '/stuecke', label: t.nav.pieces, icon: 'music' },
		{ href: '/konzerte', label: t.nav.concerts, icon: 'calendar' },
		{ href: '/meine-noten', label: t.nav.myParts, icon: 'user' },
		...(data.rights.includes('mitglieder.verwalten') && data.auth === 'on'
			? [{ href: '/admin', label: t.nav.admin, icon: 'shield' as const }]
			: [])
	]);

	function isActive(href: string) {
		const path = page.url.pathname;
		return href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
	}
</script>

<svelte:head>
	<meta name="theme-color" content={config.accent} />
</svelte:head>

<div class="app" style:--accent={config.accent}>
	<header class="topbar">
		<div class="topbar-inner">
			<a href="/" class="brand" aria-label={data.orchestraName} title={data.orchestraName}>
				<span class="logo"><Icon name="music" size={18} /></span>
				<span class="brand-full">{data.orchestraName}</span>
				<span class="brand-short">{data.orchestraShortName}</span>
			</a>

			<nav class="nav-desktop" aria-label="Hauptnavigation">
				{#each nav as item (item.href)}
					<a href={item.href} class:active={isActive(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}>
						{item.label}
					</a>
				{/each}
			</nav>

			<ThemeToggle />
			{#if data.user}
				<form class="account" method="POST" action="/auth/logout">
					<span class="avatar" title={t.auth.signedInAs(data.user.email)}>{data.user.name.charAt(0).toUpperCase()}</span>
					<button class="logout" title={t.auth.logout} aria-label={t.auth.logout}><Icon name="logout" size={18} /></button>
				</form>
			{/if}
		</div>
	</header>

	<main>
		{@render children()}
		<footer class="legal">
			<a href="/datenschutz">{t.legal.links.privacy}</a>
			<a href="/nutzungsbedingungen">{t.legal.links.terms}</a>
		</footer>
	</main>

	<nav class="tabbar" aria-label="Hauptnavigation">
		{#each nav as item (item.href)}
			<a href={item.href} class:active={isActive(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}>
				<Icon name={item.icon} size={22} />
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>
</div>

<style>
	.app {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 10;
		height: var(--header-height);
		background: color-mix(in oklab, var(--bg) 82%, transparent);
		backdrop-filter: saturate(1.4) blur(14px);
		-webkit-backdrop-filter: saturate(1.4) blur(14px);
		border-bottom: 1px solid var(--border);
	}

	.topbar-inner {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		max-width: var(--content-width);
		height: 100%;
		margin: 0 auto;
		padding: 0 var(--space-4);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		font-weight: 650;
		min-width: 0;
	}

	.brand-full {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.brand-short {
		display: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.logo {
		display: grid;
		place-items: center;
		flex: none;
		width: 32px;
		height: 32px;
		border-radius: 10px;
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.nav-desktop {
		display: flex;
		gap: var(--space-1);
		margin-left: auto;
	}

	.nav-desktop a {
		padding: var(--space-2) var(--space-3);
		white-space: nowrap;
		border-radius: 999px;
		color: var(--text-muted);
		font-weight: 500;
		transition:
			color 0.15s,
			background 0.15s;
	}

	.nav-desktop a:hover {
		color: var(--text);
		background: var(--surface-2);
	}

	.nav-desktop a.active {
		color: var(--accent);
		background: var(--accent-soft);
	}

	main {
		flex: 1;
		width: 100%;
		max-width: var(--content-width);
		margin: 0 auto;
		padding: var(--space-6) var(--space-4) var(--space-7);
	}

	.tabbar {
		display: none;
	}

	/* Five menu items and the account leave no room for the name: the logo alone links home.
	   Below 720px the menu moves to the bottom bar and the short name comes back. */
	@media (max-width: 960px) {
		.brand-full {
			display: none;
		}

		.nav-desktop a {
			padding: var(--space-2) 10px;
		}
	}

	@media (max-width: 720px) {
		.nav-desktop {
			display: none;
		}

		.topbar-inner {
			justify-content: space-between;
		}

		.brand-full {
			display: none;
		}

		.brand-short {
			display: inline;
		}

		main {
			padding-top: var(--space-5);
			padding-bottom: calc(var(--tabbar-height) + var(--space-6) + env(safe-area-inset-bottom));
		}

		.tabbar {
			position: fixed;
			inset: auto 0 0 0;
			z-index: 10;
			display: grid;
			/* As many columns as entries: admins get a fifth, "Verwaltung". */
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
			height: calc(var(--tabbar-height) + env(safe-area-inset-bottom));
			padding-bottom: env(safe-area-inset-bottom);
			background: color-mix(in oklab, var(--surface) 88%, transparent);
			backdrop-filter: saturate(1.4) blur(14px);
			-webkit-backdrop-filter: saturate(1.4) blur(14px);
			border-top: 1px solid var(--border);
		}

		.tabbar a {
			display: grid;
			place-items: center;
			align-content: center;
			gap: 2px;
			font-size: 0.6875rem;
			font-weight: 500;
			color: var(--text-muted);
			transition: color 0.15s;
		}

		.tabbar a.active {
			color: var(--accent);
		}
	}
	.legal {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
		margin-top: var(--space-6);
		padding-top: var(--space-4);
		border-top: 1px solid var(--border);
		font-size: 0.8125rem;
	}

	.legal a {
		color: var(--text-muted);
	}

	.legal a:hover {
		color: var(--accent);
	}

	.account {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-left: var(--space-2);
	}

	.avatar {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.875rem;
		font-weight: 700;
	}

	.logout {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border: 0;
		border-radius: 999px;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}

	.logout:hover {
		background: var(--surface-2);
		color: var(--text);
	}
</style>
