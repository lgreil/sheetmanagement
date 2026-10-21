<script lang="ts">
	import { page } from '$app/state';
	import { t } from '#lib/i18n/index.ts';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	// 503: Google didn't answer in time. Usually gone a moment later, so offer to try again.
	const unavailable = $derived(page.status === 503);
	const title = $derived(page.status === 404 ? t.error.notFound : unavailable ? t.error.unavailableTitle : t.error.title);
</script>

<Title {title} />

<PageHeader {title} lead={page.status === 404 ? undefined : page.error?.message} />
<div class="actions">
	{#if unavailable}
		<button type="button" class="primary" onclick={() => location.reload()}>{t.error.retry}</button>
		<a class="secondary" href="/">{t.common.backHome}</a>
	{:else}
		<a class="primary" href="/">{t.common.backHome}</a>
	{/if}
</div>

<style>
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}
	.primary,
	.secondary {
		display: inline-block;
		padding: var(--space-2) var(--space-4);
		border-radius: 999px;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.primary {
		border: none;
		background: var(--accent);
		color: var(--accent-contrast);
	}
	.secondary {
		border: 1px solid var(--border);
		color: var(--text);
	}
</style>
