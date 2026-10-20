<script lang="ts">
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { config } from '#lib/config/index.ts';
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import NavMenu from '#lib/components/NavMenu.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { isActive, navGroups, primaryNav } from '#lib/nav.ts';
	import { orchestraLinks, safeLink } from '#lib/links.ts';

	let { data, children } = $props();

	const groups = $derived(navGroups({ auth: data.auth, rights: data.rights }));
	const nav = $derived(primaryNav(groups));
	const path = $derived(page.url.pathname);
	// "Mehr" is highlighted on the pages only it links to.
	const inMore = $derived(!nav.some((item) => isActive(item.href, path)) && groups.some((g) => g.items.some((item) => isActive(item.href, path))));
	let menuOpen = $state(false);

	const links = orchestraLinks(config.links);
	const sourceUrl = safeLink(config.sourceUrl ?? '');

	afterNavigate(() => (menuOpen = false));
</script>

<svelte:head>
	<meta name="theme-color" content={config.accent} />
	<!-- On :root, so the theme tokens in app.css derive from it. -->
	{@html `<style>:root{--brand:${config.accent}}</style>`}
</svelte:head>

<div class="app">
	<header class="topbar">
		<div class="topbar-inner">
			<a href="/" class="brand" aria-label={data.orchestraName} title={data.orchestraName}>
				<img class="logo" src="/logo.png" alt="" width="40" height="40" />
				<span class="brand-full">{data.orchestraName}</span>
				<span class="brand-short">{data.orchestraShortName} <span class="app-name">{t.nav.appName}</span></span>
			</a>

			<nav class="nav-desktop" aria-label="Hauptnavigation">
				{#each nav as item (item.href)}
					<a href={item.href} class:active={isActive(item.href, path)} aria-current={isActive(item.href, path) ? 'page' : undefined}>
						{item.label}
					</a>
				{/each}
				<button
					class="more"
					class:active={inMore || menuOpen}
					aria-expanded={menuOpen}
					aria-controls="nav-menu"
					onclick={() => (menuOpen = !menuOpen)}
				>
					{t.nav.more}<Icon name="down" size={16} />
				</button>
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
		<footer class="footer">
			{#if links.length}
				<ul class="links" aria-label={t.footer.links}>
					{#each links as link (link.url)}
						<li>
							<a href={link.url} target="_blank" rel="noopener noreferrer" title={link.label}>
								<Icon name={link.icon} size={18} /><span>{link.label}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
			<div class="legal">
				<a href="/datenschutz">{t.legal.links.privacy}</a>
				<a href="/nutzungsbedingungen">{t.legal.links.terms}</a>
			</div>
			{#if sourceUrl}
				<p class="source">
					{t.nav.appName} v{__APP_VERSION__} · <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{t.footer.source}</a>
				</p>
			{/if}
		</footer>
	</main>

	<nav class="tabbar" aria-label="Hauptnavigation">
		{#each nav as item (item.href)}
			<a href={item.href} class:active={isActive(item.href, path)} aria-current={isActive(item.href, path) ? 'page' : undefined}>
				<Icon name={item.icon} size={22} />
				<span>{item.label}</span>
			</a>
		{/each}
		<button class:active={inMore || menuOpen} aria-expanded={menuOpen} aria-controls="nav-menu" onclick={() => (menuOpen = !menuOpen)}>
			<Icon name="menu" size={22} />
			<span>{t.nav.more}</span>
		</button>
	</nav>

	<NavMenu {groups} {path} bind:open={menuOpen} />
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
		background: color-mix(in oklab, var(--surface) 85%, transparent);
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

	.app-name {
		color: var(--accent);
		font-weight: 500;
	}

	.logo {
		flex: none;
		width: 40px;
		height: 40px;
	}

	.nav-desktop {
		display: flex;
		gap: var(--space-1);
		margin-left: auto;
	}

	.nav-desktop a,
	.nav-desktop .more {
		padding: var(--space-2) var(--space-3);
		white-space: nowrap;
		border-radius: 999px;
		color: var(--text-muted);
		font-weight: 500;
		transition:
			color 0.15s,
			background 0.15s;
	}

	.nav-desktop .more {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		border: 0;
		background: none;
		font: inherit;
		cursor: pointer;
	}

	.nav-desktop a:hover,
	.nav-desktop .more:hover {
		color: var(--text);
		background: var(--surface-2);
	}

	.nav-desktop a.active,
	.nav-desktop .more.active {
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

		.nav-desktop a,
		.nav-desktop .more {
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
			/* Home, the primary pages and "Mehr": five columns for everyone. */
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
			height: calc(var(--tabbar-height) + env(safe-area-inset-bottom));
			padding-bottom: env(safe-area-inset-bottom);
			background: color-mix(in oklab, var(--surface) 88%, transparent);
			backdrop-filter: saturate(1.4) blur(14px);
			-webkit-backdrop-filter: saturate(1.4) blur(14px);
			border-top: 1px solid var(--border);
		}

		.tabbar a,
		.tabbar button {
			min-width: 0;
			border: 0;
			background: none;
			font-family: inherit;
			cursor: pointer;
			display: grid;
			place-items: center;
			align-content: center;
			gap: 2px;
			font-size: 0.6875rem;
			font-weight: 500;
			color: var(--text-muted);
			transition: color 0.15s;
		}

		.tabbar a span,
		.tabbar button span {
			max-width: 100%;
			padding: 0 2px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.tabbar a.active,
		.tabbar button.active {
			color: var(--accent);
		}
	}
	.footer {
		display: grid;
		justify-items: center;
		gap: var(--space-3);
		margin-top: var(--space-6);
		padding-top: var(--space-4);
		border-top: 1px solid var(--border);
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-1) var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.links a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: var(--space-1) var(--space-2);
		border-radius: 999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.legal {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
	}

	.footer a {
		color: var(--text-muted);
	}

	.footer a:hover {
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
