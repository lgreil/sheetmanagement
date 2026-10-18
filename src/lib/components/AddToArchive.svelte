<script lang="ts">
	import { enhance } from '$app/forms';
	import { t } from '#lib/i18n/index.ts';
	import Icon from './Icon.svelte';

	/** A collapsed form for "archiv.bearbeiten": a past concert or a piece without sheet music. */
	let {
		kind,
		orchestras = [],
		result
	}: {
		kind: 'concert' | 'piece';
		orchestras?: string[];
		result?: { archiveError?: string; values?: Record<string, string> } | null;
	} = $props();

	// Opens again after a refused entry, with what was typed.
	let open = $state(false);
	const shown = $derived(open || !!result?.archiveError);
	const values = $derived(result?.values ?? {});
	let busy = $state(false);
</script>

<section class="add">
	{#if shown}
		<form
			method="POST"
			action={kind === 'concert' ? '?/addConcert' : '?/addPiece'}
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<h2>{kind === 'concert' ? t.archive.addConcert : t.archive.addPiece}</h2>
			<p class="lead">{kind === 'concert' ? t.archive.addConcertLead : t.archive.addPieceLead}</p>
			{#if result?.archiveError}<p class="msg error" role="alert">{result.archiveError}</p>{/if}
			{#if kind === 'concert'}
				<label class="field">
					{t.archive.title}
					<input name="title" required maxlength="200" value={values.title ?? ''} placeholder={t.archive.titleHint} autocomplete="off" />
				</label>
				<label class="field">
					{t.archive.date}
					<input name="date" maxlength="40" value={values.date ?? ''} placeholder={t.archive.dateHint} autocomplete="off" />
				</label>
				<label class="field">{t.archive.location}<input name="location" maxlength="200" value={values.location ?? ''} autocomplete="off" /></label>
				{#if orchestras.length}
					<label class="field">
						{t.archive.orchestra}
						<select name="orchestra" value={values.orchestra ?? orchestras[0]}>
							{#each orchestras as orchestra (orchestra)}<option value={orchestra}>{orchestra}</option>{/each}
						</select>
					</label>
				{/if}
			{:else}
				<label class="field">
					{t.archive.pieceTitle}
					<input name="title" required maxlength="200" value={values.title ?? ''} autocomplete="off" />
				</label>
				<label class="field">{t.archive.composer}<input name="composer" maxlength="200" value={values.composer ?? ''} autocomplete="off" /></label>
				<label class="field">{t.archive.catalogue}<input name="catalogue" maxlength="200" value={values.catalogue ?? ''} autocomplete="off" /></label>
			{/if}
			<div class="actions">
				<button class="btn" disabled={busy}><Icon name="plus" size={16} />{t.archive.add}</button>
				<button class="btn ghost" type="button" onclick={() => (open = false)}>{t.reports.cancel}</button>
			</div>
		</form>
	{:else}
		<button class="btn ghost" onclick={() => (open = true)}>
			<Icon name="plus" size={16} />{kind === 'concert' ? t.archive.addConcert : t.archive.addPiece}
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
