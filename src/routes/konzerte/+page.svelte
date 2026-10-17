<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';
</script>

<Title title={t.concerts.title} />

<PageHeader title={t.concerts.title} lead={t.concerts.lead} />
<EmptyState icon="calendar" text={t.concerts.empty} />
