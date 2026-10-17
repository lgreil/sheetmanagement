<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '#lib/i18n/index.ts';
	import Icon, { type IconName } from './Icon.svelte';

	type Theme = 'system' | 'light' | 'dark';
	const order: Theme[] = ['system', 'light', 'dark'];
	const icons: Record<Theme, IconName> = { system: 'monitor', light: 'sun', dark: 'moon' };

	let theme = $state<Theme>('system');

	onMount(() => {
		const current = document.documentElement.dataset.theme;
		if (current === 'light' || current === 'dark') theme = current;
	});

	function cycle() {
		theme = order[(order.indexOf(theme) + 1) % order.length];
		const root = document.documentElement;
		if (theme === 'system') delete root.dataset.theme;
		else root.dataset.theme = theme;
		try {
			if (theme === 'system') localStorage.removeItem('theme');
			else localStorage.setItem('theme', theme);
		} catch {
			// Storage can be blocked; the choice then lasts for this visit only.
		}
	}
</script>

<button class="toggle" onclick={cycle} title="{t.theme.label}: {t.theme[theme]}" aria-label="{t.theme.label}: {t.theme[theme]}">
	<Icon name={icons[theme]} />
</button>

<style>
	.toggle {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text-muted);
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s,
			transform 0.15s;
	}

	.toggle:hover {
		color: var(--text);
		border-color: var(--text-muted);
	}

	.toggle:active {
		transform: scale(0.94);
	}
</style>
