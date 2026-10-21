<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '#lib/forms.svelte.ts';
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import MemberFields from '#lib/components/MemberFields.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
	const saving = new FormState();
</script>

<Title title={t.profile.title} />
<PageHeader title={t.profile.title} lead={t.profile.lead} />

{#if !data.member}
	<p class="msg info">{t.profile.notMember}</p>
{:else}
	<form
		class="card"
		method="POST"
		use:enhance={saving.submit()}
	>
		<p class="email"><span class="muted">{t.profile.email}</span> {data.email}</p>
		<!-- Rebuilt after saving, so the form shows what's in the sheet now. -->
		{#key JSON.stringify(data.member)}
			<MemberFields member={data.member} instruments={data.instruments} common={data.common} orchestras={data.orchestras} />
		{/key}

		{#if data.member.groups.length}
			<p class="groups">
				<span class="muted">{t.profile.groups}</span>
				{#each data.member.groups as group (group)}<span class="tag">{group}</span>{/each}
				<span class="muted small">{t.profile.groupsHint}</span>
			</p>
		{/if}

		{#if form?.message}<p class="msg error" role="alert">{form.message}</p>{/if}
		<div class="actions">
			<button class="btn" disabled={saving.busy}><Icon name="check" size={16} />{t.profile.save}</button>
			{#if form?.saved}<span class="muted" role="status">{t.profile.saved}</span>{/if}
		</div>
	</form>
{/if}

<style>
	.card {
		display: grid;
		gap: var(--space-5);
		max-width: 640px;
		padding: var(--space-5);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.email,
	.groups {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.small {
		flex-basis: 100%;
		font-size: 0.8125rem;
	}

	.tag {
		padding: 0 var(--space-2);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	@media (max-width: 480px) {
		.card {
			padding: var(--space-4);
		}
	}
</style>
