<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '#lib/i18n/index.ts';
	import Segmented from './Segmented.svelte';

	/** System, light or dark as one segmented control; shown in the menu and on the profile. */
	type Theme = 'system' | 'light' | 'dark';
	const options = [
		{ value: 'system' as const, label: t.theme.system, icon: 'monitor' as const },
		{ value: 'light' as const, label: t.theme.light, icon: 'sun' as const },
		{ value: 'dark' as const, label: t.theme.dark, icon: 'moon' as const }
	];

	let theme = $state<Theme>('system');

	onMount(() => {
		const current = document.documentElement.dataset.theme;
		if (current === 'light' || current === 'dark') theme = current;
	});

	function apply(next: Theme) {
		const root = document.documentElement;
		if (next === 'system') delete root.dataset.theme;
		else root.dataset.theme = next;
		try {
			if (next === 'system') localStorage.removeItem('theme');
			else localStorage.setItem('theme', next);
		} catch {
			// Storage can be blocked; the choice then lasts for this visit only.
		}
	}
</script>

<Segmented {options} bind:value={theme} label={t.theme.label} onchange={apply} />
