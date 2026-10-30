<script lang="ts">
	import PartSetBuilder from '#lib/components/PartSetBuilder.svelte';

	let { data } = $props();
</script>

<PartSetBuilder {data} />
