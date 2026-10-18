<script lang="ts">
	import { enhance } from '$app/forms';
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
	let busy = $state(false);
	// After a refused save, the form keeps what was typed.
	const values = $derived(form?.values ?? (data.state === 'ready' ? data.values : undefined));

	const columns = t.sheet.pieces.columns;
	const FIELDS = [
		{ name: 'title', wide: true, required: true },
		{ name: 'composer' },
		{ name: 'catalogue' },
		{ name: 'arranger' },
		{ name: 'genre' },
		{ name: 'difficulty' },
		{ name: 'reviewedAt', placeholder: t.pieceEditor.reviewedHint },
		{ name: 'recording', wide: true, type: 'url', placeholder: t.pieceEditor.recordingHint }
	] as const;
</script>

<Title title={t.pieceEditor.title(data.piece.title)} />

<a class="back" href="/stuecke/{encodeURIComponent(data.piece.id)}"><Icon name="back" size={18} />{data.piece.title}</a>
<h1>{t.pieceEditor.title(data.piece.title)}</h1>

{#if data.state === 'not-in-sheet' || !values}
	<p class="msg info">{t.pieceEditor.notInSheet}</p>
{:else}
	<p class="lead">{t.pieceEditor.lead}</p>
	{#if data.piece.folderName}<p class="folder"><Icon name="folder" size={14} />{data.piece.folderName}</p>{/if}
	{#if form?.message}<p class="msg error" role="alert">{form.message}</p>{/if}

	<form
		method="POST"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
	>
		<input type="hidden" name="version" value={data.version} />
		{#each FIELDS as field (field.name)}
			<label class="field" class:wide={'wide' in field}>
				{columns[field.name]}
				<input
					name={field.name}
					type={'type' in field ? field.type : 'text'}
					value={values[field.name]}
					required={'required' in field}
					placeholder={'placeholder' in field ? field.placeholder : undefined}
					maxlength="1000"
					autocomplete="off"
				/>
			</label>
		{/each}
		<label class="field wide">
			{columns.notes}
			<textarea name="notes" maxlength="1000">{values.notes}</textarea>
		</label>
		<div class="actions">
			<button class="btn" disabled={busy}><Icon name="check" size={16} />{t.pieceEditor.save}</button>
			<a class="btn ghost" href="/stuecke/{encodeURIComponent(data.piece.id)}">{t.pieceEditor.cancel}</a>
		</div>
	</form>
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		margin-bottom: var(--space-4);
		color: var(--text-muted);
		font-weight: 500;
	}

	h1 {
		margin-bottom: var(--space-2);
	}

	.lead {
		margin-bottom: var(--space-2);
		color: var(--text-muted);
	}

	.folder {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		margin-bottom: var(--space-4);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.msg {
		margin-bottom: var(--space-4);
	}

	form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--space-3);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.wide,
	.actions {
		grid-column: 1 / -1;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
</style>
