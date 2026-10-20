<script lang="ts">
	import { enhance } from '$app/forms';
	import { REPORT_KINDS, type ReportKind } from '#lib/feedback/feedback.ts';
	import { t } from '#lib/i18n/index.ts';
	import Icon from './Icon.svelte';

	interface OpenReport {
		id: string;
		part: string;
		kind: ReportKind;
		comment: string;
		reportedAt: string;
		reportedBy?: string;
	}

	let {
		reports,
		status,
		canClose,
		parts,
		instruments = [],
		present = [],
		result,
		open = $bindable(false),
		fileId = $bindable('')
	}: {
		reports: OpenReport[];
		status: 'ready' | 'sign-in' | 'not-set-up' | 'no-parts';
		canClose: boolean;
		parts: { id: string; label: string }[];
		/** For "Stimme fehlt": every instrument a part can be for … */
		instruments?: string[];
		/** … and the ones the piece already has a part for, offered last. */
		present?: string[];
		result?: { reportError?: string; reported?: boolean } | null;
		open?: boolean;
		fileId?: string;
	} = $props();

	let busy = $state(false);
	let kind = $state<ReportKind>('missing');
	// A part that's missing has no file to pick: name the instrument instead.
	const missing = $derived(kind === 'missing' && !fileId);
	const absent = $derived(instruments.filter((name) => !present.includes(name)));
	const already = $derived(instruments.filter((name) => present.includes(name)));
	let dialog = $state<HTMLElement>();

	$effect(() => {
		if (open) dialog?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	});
</script>

{#if reports.length || status !== 'no-parts'}
	<section class="reports" id="melden" bind:this={dialog}>
		{#if reports.length}
			<div class="known">
				<h2><Icon name="alert" size={16} />{t.reports.known}</h2>
				<ul>
					{#each reports as report (report.id)}
						<li>
							<strong>{report.part || t.reports.wholePiece}</strong>
							– {t.feedbackValues.reportKind[report.kind]}{report.comment ? `: ${report.comment}` : ''}
							<span class="muted">
								{report.reportedBy ? t.reports.by(report.reportedBy, report.reportedAt) : report.reportedAt}
							</span>
						</li>
					{/each}
				</ul>
				{#if canClose}<a class="manage" href="/meldungen">{t.nav.reports} →</a>{/if}
			</div>
		{/if}

		{#if result?.reported}
			<p class="msg ok" role="status"><Icon name="check" size={16} />{t.reports.thanks}</p>
		{/if}

		{#if status === 'ready'}
			{#if open}
				<form
					class="form"
					method="POST"
					action="?/report"
					use:enhance={() => {
						busy = true;
						return async ({ update, result: outcome }) => {
							await update({ reset: true });
							busy = false;
							if (outcome.type === 'success') {
								open = false;
								fileId = '';
							}
						};
					}}
				>
					<h3>{t.reports.report}</h3>
					<p class="muted">{t.reports.lead}</p>
					{#if result?.reportError}<p class="msg error" role="alert">{result.reportError}</p>{/if}
					<label class="field">
						{t.reports.kind}
						<select name="kind" required bind:value={kind}>
							{#each REPORT_KINDS as option (option)}<option value={option}>{t.feedbackValues.reportKind[option]}</option>{/each}
						</select>
					</label>
					{#if missing && instruments.length}
						<label class="field">
							{t.reports.missingPart}
							<select name="missingInstrument" required>
								<option value="" disabled selected>…</option>
								<optgroup label={t.reports.notInFolder}>
									{#each absent as name (name)}<option value={name}>{name}</option>{/each}
								</optgroup>
								<optgroup label={t.reports.inFolder}>
									{#each already as name (name)}<option value={name}>{name}</option>{/each}
								</optgroup>
							</select>
						</label>
						<label class="field">
							{t.reports.missingNumber}
							<select name="missingNumber">
								<option value="">–</option>
								{#each ['I', 'II', 'III', 'IV'] as roman, i (roman)}<option value={String(i + 1)}>{roman}</option>{/each}
							</select>
						</label>
					{:else}
						<label class="field">
							{t.reports.part}
							<select name="fileId" bind:value={fileId}>
								<option value="">{t.reports.wholePiece}</option>
								{#each parts as part (part.id)}<option value={part.id}>{part.label}</option>{/each}
							</select>
						</label>
					{/if}
					<label class="field wide">
						{t.reports.comment}
						<input name="comment" maxlength="1000" placeholder={t.reports.commentHint} autocomplete="off" />
					</label>
					<div class="actions">
						<button class="btn" disabled={busy}><Icon name="flag" size={16} />{t.reports.send}</button>
						<button class="btn ghost" type="button" onclick={() => (open = false)}>{t.reports.cancel}</button>
					</div>
				</form>
			{:else}
				<button class="btn ghost" onclick={() => (open = true)}><Icon name="flag" size={16} />{t.reports.report}</button>
			{/if}
		{:else if status === 'not-set-up' && canClose}
			<p class="msg info">{t.reports.notSetUp}</p>
		{/if}
	</section>
{/if}

<style>
	.reports {
		display: grid;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
		scroll-margin-top: calc(var(--header-height) + var(--space-4));
	}

	.reports > .btn {
		justify-self: start;
	}

	.known {
		padding: var(--space-3) var(--space-4);
		border: 1px solid color-mix(in oklab, var(--warn) 40%, var(--border));
		border-radius: var(--radius-m);
		background: color-mix(in oklab, var(--warn) 8%, var(--surface));
	}

	.known h2 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
		color: var(--warn);
		font-size: 0.875rem;
	}

	.known ul {
		display: grid;
		gap: var(--space-1);
		margin: 0;
		padding-left: var(--space-4);
	}

	.muted {
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.manage {
		display: inline-block;
		margin-top: var(--space-2);
		color: var(--accent);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.form h3,
	.form > p,
	.wide,
	.actions {
		grid-column: 1 / -1;
	}

	.form h3 {
		font-size: 1rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
</style>
