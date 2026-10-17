<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';
</script>

<Title title={t.pieces.title} />

<PageHeader title={t.pieces.title} lead={t.pieces.lead} />
<EmptyState icon="music" text={t.pieces.empty} />
