<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '#lib/forms.svelte.ts';
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
	const saving = new FormState();
	const submit = saving.submit({ reset: true });
</script>

<Title title={t.reports.title} />
<PageHeader title={t.reports.title} lead={t.reports.pageLead} />


{#if data.state === 'not-set-up'}
	<p class="msg info">{t.reports.notSetUp}</p>
{:else}
	{#if form?.message}
		<p class="msg error" role="alert">{form.message}</p>
	{:else if form && 'warning' in form && form.warning}
		<p class="msg error" role="alert">{form.warning}</p>
	{/if}

	{#snippet list(reports: typeof data.open, done: boolean)}
		<ul class="list">
			{#each reports as report (report.id)}
				<li class="row">
					<div class="main">
						<a class="piece" href="/stuecke/{encodeURIComponent(report.pieceId)}">{report.pieceName || t.reports.toPiece}</a>
						<span>
							<strong>{report.part || t.reports.wholePiece}</strong>
							– {t.feedbackValues.reportKind[report.kind]}
						</span>
						{#if report.comment}<span class="comment">„{report.comment}“</span>{/if}
						<span class="muted">{t.reports.by(report.reportedBy, report.reportedAt)}</span>
						{#if done && report.note}<span class="muted">{t.sheet.reports.columns.note}: {report.note}</span>{/if}
						{#if report.inDrive || report.marked}
							<span class="drive">
								{#if report.inDrive}<span class="badge"><Icon name="check" size={12} />{t.reports.inDrive}</span>{/if}
								{#if report.marked}<span class="badge marked">{t.reports.marked(data.statusWords.find((s) => s.status === report.marked)?.word ?? '')}</span>{/if}
							</span>
						{/if}
						{#if !done && report.placeholder && !report.placeholder.exists}
							{@const manual = !data.driveWrite || form?.manual?.id === report.id}
							<div class="placeholder">
								{#if manual}
									<span class="muted">{t.reports.placeholderManual}</span>
									<code>{report.placeholder.name}</code>
									<a href={report.placeholder.folderUrl} target="_blank" rel="noopener noreferrer"><Icon name="folder" size={14} />{t.naming.openFolder}</a>
								{:else}
									<form method="POST" action="?/confirmMissing" use:enhance={submit} title={t.reports.confirmMissingHint(report.placeholder.name)}>
										<input type="hidden" name="id" value={report.id} />
										<button class="btn small" disabled={saving.busy}><Icon name="check" size={14} />{t.reports.confirmMissing}</button>
									</form>
									<span class="muted small">{t.reports.confirmMissingHint(report.placeholder.name)}</span>
								{/if}
							</div>
						{/if}
						{#if !done && data.driveWrite && report.fileId && !report.marked}
							<form method="POST" action="?/mark" use:enhance={submit} class="mark" title={t.reports.markHint}>
								<input type="hidden" name="id" value={report.id} />
								<label class="field">
									<span class="sr-only">{t.reports.markLabel}</span>
									<select name="status" value={report.suggested}>
										{#each data.statusWords as option (option.status)}<option value={option.status}>{option.word}</option>{/each}
									</select>
								</label>
								<button class="btn small ghost" disabled={saving.busy}><Icon name="text" size={14} />{t.reports.mark}</button>
							</form>
						{/if}
					</div>
					<form method="POST" action={done ? '?/reopen' : '?/close'} use:enhance={submit} class="close">
						<input type="hidden" name="id" value={report.id} />
						{#if !done}
							<label class="field">
								<span class="sr-only">{t.reports.note}</span>
								<input name="note" maxlength="500" placeholder={t.reports.noteHint} autocomplete="off" />
							</label>
							<button class="btn small" disabled={saving.busy}><Icon name="check" size={14} />{t.reports.close}</button>
						{:else}
							<input type="hidden" name="note" value={report.note} />
							<button class="btn small ghost" disabled={saving.busy}>{t.reports.reopen}</button>
						{/if}
					</form>
				</li>
			{/each}
		</ul>
	{/snippet}

	<section>
		<h2>{t.reports.open} <span class="count">{data.open.length}</span></h2>
		{#if data.open.length}{@render list(data.open, false)}{:else}<p class="msg info">{t.reports.noOpen}</p>{/if}
	</section>

	<section>
		<h2>{t.reports.done} <span class="count">{data.done.length}</span></h2>
		{#if data.done.length}{@render list(data.done, true)}{:else}<p class="msg info">{t.reports.noDone}</p>{/if}
	</section>
{/if}

<style>
	section {
		margin-bottom: var(--space-6);
	}

	.placeholder {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.875rem;
	}

	.placeholder code {
		padding: 0 6px;
		border-radius: 6px;
		background: var(--surface-2);
		user-select: all;
	}

	.placeholder a {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--accent);
		font-weight: 600;
	}

	.small {
		font-size: 0.8125rem;
	}


	h2 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0 0 var(--space-2) var(--space-1);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.count {
		padding: 0 var(--space-2);
		border-radius: 999px;
		background: var(--surface-2);
		letter-spacing: 0;
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		overflow: hidden;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
	}

	.row + .row {
		border-top: 1px solid var(--border);
	}

	.main {
		display: grid;
		gap: 2px;
		flex: 1;
		min-width: 220px;
	}

	.piece {
		color: var(--accent);
		font-weight: 600;
	}

	.comment {
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--text-muted);
		font-size: 0.8125rem;
		overflow-wrap: anywhere;
	}

	.drive {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 0 var(--space-2);
		border-radius: 999px;
		background: color-mix(in oklab, var(--ok) 12%, transparent);
		color: var(--ok);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge.marked {
		background: color-mix(in oklab, var(--warn) 14%, transparent);
		color: var(--warn);
	}

	.mark {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-1);
	}

	.mark select {
		padding: 5px var(--space-2);
	}

	.close {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}

	.close input {
		width: 200px;
		padding: 6px var(--space-3);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>
