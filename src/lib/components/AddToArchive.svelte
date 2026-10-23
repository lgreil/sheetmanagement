<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '#lib/forms.svelte.ts';
	import { t } from '#lib/i18n/index.ts';
	import Icon from './Icon.svelte';

	/** A collapsed form for "archiv.bearbeiten": a piece without sheet music. Past concerts are entered with the dates on /kalender. */
	let { result }: { result?: { archiveError?: string; values?: Record<string, string> } | null } = $props();

	// Opens again after a refused entry, with what was typed.
	let open = $state(false);
	const shown = $derived(open || !!result?.archiveError);
	const values = $derived(result?.values ?? {});
	const saving = new FormState();
</script>

<section class="add">
	{#if shown}
		<form
			method="POST"
			action="?/addPiece"
			use:enhance={saving.submit()}
		>
			<h2>{t.archive.addPiece}</h2>
			<p class="lead">{t.archive.addPieceLead}</p>
			{#if result?.archiveError}<p class="msg error" role="alert">{result.archiveError}</p>{/if}
			<label class="field">
				{t.archive.pieceTitle}
				<input name="title" required maxlength="200" value={values.title ?? ''} autocomplete="off" />
			</label>
			<label class="field">{t.archive.composer}<input name="composer" maxlength="200" value={values.composer ?? ''} autocomplete="off" /></label>
			<label class="field">{t.archive.catalogue}<input name="catalogue" maxlength="200" value={values.catalogue ?? ''} autocomplete="off" /></label>
			<div class="actions">
				<button class="btn" disabled={saving.busy}><Icon name="plus" size={16} />{t.archive.add}</button>
				<button class="btn ghost" type="button" onclick={() => (open = false)}>{t.reports.cancel}</button>
			</div>
		</form>
	{:else}
		<button class="btn ghost" onclick={() => (open = true)}>
			<Icon name="plus" size={16} />{t.archive.addPiece}
		</button>
	{/if}
</section>

<style>
	.add {
		margin-top: var(--space-6);
	}

	form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	h2,
	.lead,
	.msg,
	.actions {
		grid-column: 1 / -1;
	}

	h2 {
		font-size: 1rem;
	}

	.lead {
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
</style>
