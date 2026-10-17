<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';
</script>

<Title title={t.myParts.title} />

<PageHeader title={t.myParts.title} lead={t.myParts.lead} />
<EmptyState icon="user" text={t.myParts.empty} />
