<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import { isActive, type NavGroup } from '#lib/nav.ts';
	import Icon from './Icon.svelte';

	/** Every page by group: a panel below the header on wide screens, a sheet above the tab bar on phones. */
	let { groups, path, open = $bindable(false) }: { groups: NavGroup[]; path: string; open?: boolean } = $props();

	function onkeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') open = false;
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<button class="backdrop" aria-label={t.nav.close} onclick={() => (open = false)}></button>
	<div class="panel" id="nav-menu" role="dialog" aria-label={t.nav.menu}>
		{#each groups as group (group.key)}
			<section>
				<h2>{group.label}</h2>
				<ul>
					{#each group.items as item (item.href)}
						<li>
							<a
								href={item.href}
								class:active={isActive(item.href, path)}
								aria-current={isActive(item.href, path) ? 'page' : undefined}
								onclick={() => (open = false)}
							>
								<Icon name={item.icon} size={18} />{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 20;
		border: 0;
		background: rgb(0 0 0 / 0.18);
		cursor: default;
	}

	.panel {
		position: fixed;
		z-index: 21;
		top: calc(var(--header-height) + var(--space-2));
		right: max(var(--space-4), calc((100vw - var(--content-width)) / 2 + var(--space-4)));
		display: grid;
		grid-template-columns: repeat(2, minmax(180px, 1fr));
		gap: var(--space-4) var(--space-5);
		width: min(480px, calc(100vw - 2 * var(--space-4)));
		padding: var(--space-4) var(--space-5);
		border: 1px solid var(--border);
		border-radius: var(--radius-l);
		background: var(--surface);
		box-shadow: var(--shadow), 0 12px 40px rgb(0 0 0 / 0.12);
		animation: drop 0.14s ease-out;
	}

	h2 {
		margin-bottom: var(--space-1);
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	ul {
		display: grid;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	a {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		margin: 0 calc(-1 * var(--space-2));
		border-radius: var(--radius-s);
		font-weight: 500;
	}

	a:hover {
		background: var(--surface-2);
	}

	a.active {
		color: var(--accent);
		background: var(--accent-soft);
	}

	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
	}

	@media (max-width: 720px) {
		.panel {
			top: auto;
			right: var(--space-2);
			left: var(--space-2);
			bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom) + var(--space-2));
			width: auto;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--space-4);
			padding: var(--space-4);
		}
	}
</style>
