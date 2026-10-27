<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '#lib/forms.svelte.ts';
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
	const saving = new FormState();
	const adding = new FormState();
	type Loan = Extract<typeof data, { state: 'ready' }>['open'][number];
	// After a refused save, the form keeps what was typed.
	const values = $derived(form && 'values' in form ? form.values : undefined);
	// Opened right away when there's nothing yet, or when coming from a piece.
	// svelte-ignore state_referenced_locally
	let addOpen = $state(data.state === 'ready' && (!data.open.length || !!data.piece));
</script>

<Title title={t.loans.title} />
<PageHeader title={t.loans.title} lead={t.loans.lead} />

{#if data.state === 'not-set-up'}
	<p class="msg info">{t.loans.notSetUp}</p>
{:else}
	{#if form?.message}<p class="msg error" role="alert">{form.message}</p>{/if}
	{#if form && 'added' in form}<p class="msg ok" role="status"><Icon name="check" size={16} />{t.loans.saved}</p>{/if}

	{#snippet row(loan: Loan)}
		<li class="loan {loan.state}">
			<div class="main">
				{#if loan.pieceId}
					<a class="title" href="/stuecke/{encodeURIComponent(loan.pieceId)}">{loan.title}</a>
				{:else}
					<span class="title">{loan.title}</span>
				{/if}
				<span class="muted">
					{[loan.from && t.loans.from(loan.from), loan.borrowedAt && t.loans.borrowedAt(loan.borrowedAt)].filter(Boolean).join(' · ')}
				</span>
				{#if loan.state !== 'returned'}
					<span class="due">
						<Icon name={loan.state === 'overdue' ? 'alert' : 'clock'} size={14} />
						{loan.dueAt ? t.loans.dueAt(loan.dueAt) : t.loans.dueUnknown}
						{#if loan.days !== undefined && loan.state !== 'open'}<strong>· {t.loans.due(loan.days)}</strong>{/if}
					</span>
				{/if}
				{#if loan.notes}<span class="notes">{loan.notes}</span>{/if}
			</div>
			<form method="POST" action={loan.state === 'returned' ? '?/reopen' : '?/returned'} use:enhance={saving.submit()}>
				<input type="hidden" name="row" value={loan.row} />
				<input type="hidden" name="piece" value={loan.pieceName} />
				{#if loan.state === 'returned'}
					<button class="btn small ghost" disabled={saving.busy}>{t.loans.reopen}</button>
				{:else}
					<button class="btn small secondary" disabled={saving.busy}><Icon name="check" size={14} />{t.loans.markReturned}</button>
				{/if}
			</form>
		</li>
	{/snippet}

	<section class="block">
		<h2 class="ui-label">{t.loans.open} <span class="count">{data.open.length}</span></h2>
		{#if data.open.length}
			<ul class="ui-list">
				{#each data.open as loan (loan.row)}{@render row(loan)}{/each}
			</ul>
		{:else}
			<p class="msg info">{t.loans.noOpen}</p>
		{/if}
	</section>

	<details class="ui-card add" bind:open={addOpen}>
		<summary><Icon name="plus" size={16} />{t.loans.add}</summary>
		<p class="muted">{t.loans.addLead}</p>
		<form method="POST" action="?/add" use:enhance={adding.submit({ reset: true })}>
			<label class="field wide">
				{t.loans.piece}
				<input name="piece" list="loan-pieces" required maxlength="300" autocomplete="off" placeholder={t.loans.pieceHint} value={values?.piece ?? data.piece} />
			</label>
			<label class="field wide">
				{t.loans.fromLabel}
				<input name="from" required maxlength="300" value={values?.from ?? ''} />
			</label>
			<label class="field">
				{t.loans.borrowedLabel}
				<input name="borrowedAt" type="date" value={values?.borrowedAt ?? ''} />
			</label>
			<label class="field">
				{t.loans.dueLabel}
				<input name="dueAt" type="date" value={values?.dueAt ?? ''} />
			</label>
			<label class="field wide">
				{t.loans.notes}
				<input name="notes" maxlength="500" placeholder={t.loans.notesHint} value={values?.notes ?? ''} />
			</label>
			<div class="wide">
				<button class="btn" disabled={adding.busy}><Icon name="check" size={16} />{t.loans.save}</button>
			</div>
			<datalist id="loan-pieces">{#each data.pieces as piece (piece)}<option value={piece}></option>{/each}</datalist>
		</form>
	</details>

	{#if data.returned.length}
		<details class="block ui-disclosure returned">
			<summary>{t.loans.pastReturned(data.returned.length)}</summary>
			<ul class="ui-list">
				{#each data.returned as loan (loan.row)}{@render row(loan)}{/each}
			</ul>
		</details>
	{/if}
{/if}

<style>
	.block {
		margin-bottom: var(--space-6);
	}

	.count {
		margin-left: var(--space-1);
		color: var(--text-muted);
		font-weight: 600;
	}

	.loan {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
	}

	.loan.overdue {
		box-shadow: inset 3px 0 0 var(--danger);
	}

	.loan.due-soon {
		box-shadow: inset 3px 0 0 var(--warn);
	}

	.main {
		display: grid;
		flex: 1;
		gap: 2px;
		min-width: min(100%, 240px);
	}

	.title {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	a.title:hover {
		color: var(--accent);
	}

	.muted,
	.notes {
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.notes {
		font-style: italic;
	}

	.due {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-sm);
	}

	.overdue .due {
		color: var(--danger);
	}

	.due-soon .due {
		color: var(--warn);
	}

	.add {
		margin-bottom: var(--space-6);
		padding: var(--space-4) var(--space-5);
	}

	.add summary {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 32px;
		color: var(--accent);
		font-weight: 600;
		cursor: pointer;
		list-style: none;
	}

	.add summary::-webkit-details-marker {
		display: none;
	}

	.add[open] summary {
		margin-bottom: var(--space-2);
	}

	.add form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--space-3);
		margin-top: var(--space-3);
	}

	.wide {
		grid-column: 1 / -1;
	}

	.returned {
		opacity: 0.85;
	}

	.returned summary {
		color: var(--text-muted);
	}
</style>
