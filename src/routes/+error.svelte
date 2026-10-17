<script lang="ts">
	import { page } from '$app/state';
	import { t } from '#lib/i18n/index.ts';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';
</script>

<Title title={page.status === 404 ? t.error.notFound : t.error.title} />

<PageHeader
	title={page.status === 404 ? t.error.notFound : t.error.title}
	lead={page.status === 404 ? undefined : page.error?.message}
/>
<a class="back" href="/">{t.common.backHome}</a>

<style>
	.back {
		display: inline-block;
		padding: var(--space-2) var(--space-4);
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-contrast);
		font-weight: 600;
	}
</style>
