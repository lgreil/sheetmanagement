<script lang="ts">
	import { page } from '$app/state';

	let { title }: { title?: string } = $props();
	const name = $derived(page.data.orchestraName as string);
</script>

<svelte:head>
	<title>{title ? `${title} · ${name}` : name}</title>
</svelte:head>
