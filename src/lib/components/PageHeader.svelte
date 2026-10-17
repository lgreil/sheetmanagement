<script lang="ts">
	let { title, lead }: { title: string; lead?: string } = $props();
</script>

<header class="page-header">
	<h1>{title}</h1>
	{#if lead}<p>{lead}</p>{/if}
</header>

<style>
	.page-header {
		display: grid;
		gap: var(--space-2);
		margin-bottom: var(--space-5);
	}

	p {
		color: var(--text-muted);
		font-size: 1.0625rem;
	}
</style>
