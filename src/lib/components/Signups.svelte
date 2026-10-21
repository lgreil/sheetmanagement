<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '#lib/forms.svelte.ts';
	import { t } from '#lib/i18n/index.ts';
	import { ANSWERS } from '#lib/signups/signups.ts';
	import type { PageData } from '../../routes/konzerte/[id]/$types';
	import Icon from './Icon.svelte';

	/** "Bist du dabei?" on an upcoming event, and how well each section is covered (#94). */
	type Ready = Extract<NonNullable<Extract<PageData, { kind: 'event' }>['signups']>, { state: 'ready' }>;
	let {
		signups,
		result
	}: {
		signups: Ready;
		result?: { signupError?: string; signupSaved?: boolean } | null;
	} = $props();

	const saving = new FormState();
	const submit = saving.submit();

	const ICONS = { yes: 'check', maybe: 'minus', no: 'x' } as const;
	const KINDS = ['yes', 'maybe', 'no', 'open'] as const;
	const mine = $derived(signups.mine);
	const otherSections = $derived(signups.instruments.filter((name) => !signups.ownSections.includes(name)));
</script>

<section class="signups" id="anmeldung">
	<div class="ask">
		<h2>{t.signups.question}</h2>
		<form class="answers" method="POST" action="?/answer" use:enhance={submit}>
			{#each ANSWERS as answer (answer)}
				<button
					class="answer {answer}"
					class:chosen={mine?.answer === answer}
					aria-pressed={mine?.answer === answer}
					name="answer"
					value={answer}
					disabled={saving.busy}
				>
					<Icon name={ICONS[answer]} size={16} />{t.signups.answers[answer]}
				</button>
			{/each}
		</form>
		{#if result?.signupError}<p class="msg error" role="alert">{result.signupError}</p>{/if}

		{#if mine}
			<details class="details">
				<summary>
					{t.signups.details}{mine.instrument ? ` · ${mine.instrument}` : ''}{mine.comment ? ` · „${mine.comment}“` : ''}
				</summary>
				<form class="details-form" method="POST" action="?/answer" use:enhance={submit}>
					<input type="hidden" name="answer" value={mine.answer} />
					<label class="field">
						{t.signups.instrument}
						<select name="instrument" value={mine.instrument}>
							<option value="">{t.signups.ownInstrument(signups.ownInstrument)}</option>
							{#each signups.ownSections as name (name)}<option value={name}>{name}</option>{/each}
							<optgroup label="…">
								{#each otherSections as name (name)}<option value={name}>{name}</option>{/each}
							</optgroup>
						</select>
					</label>
					<label class="field grow">
						{t.signups.comment}
						<input name="comment" value={mine.comment} maxlength="500" placeholder={t.signups.commentHint} autocomplete="off" />
					</label>
					<button class="btn small" disabled={saving.busy}>{t.signups.save}</button>
				</form>
				<form method="POST" action="?/withdraw" use:enhance={submit}>
					<button class="link" disabled={saving.busy}>{t.signups.withdraw}</button>
				</form>
			</details>
		{/if}
	</div>

	<!-- Who comes, per section: one line folded, the full list on demand. -->
	<details class="coverage ui-disclosure">
		<summary>
			<span class="coverage-title">{t.signups.coverage}</span>
			<span class="summary">{t.signups.summary(signups.totals.yes, signups.totals.maybe, signups.totals.no, signups.totals.open)}</span>
		</summary>
		{#if signups.sections.length}
			<ul class="sections">
				{#each signups.sections as section (section.label)}
					{@const expected = section.counts.yes + section.counts.maybe + section.counts.open}
					<li class:uncovered={section.counts.yes === 0}>
						<span class="label">{section.label}</span>
						<span class="bar" aria-hidden="true">
							<span class="yes" style:width="{expected ? (section.counts.yes / expected) * 100 : 0}%"></span>
							<span class="maybe" style:width="{expected ? (section.counts.maybe / expected) * 100 : 0}%"></span>
						</span>
						<span class="count">
							{#if section.counts.yes === 0}{t.signups.uncovered}{:else}{section.counts.yes}/{expected}{/if}
						</span>
						{#if section.names}
							<details class="names">
								<summary aria-label={section.label}><Icon name="down" size={14} /></summary>
								<dl>
									{#each KINDS as kind (kind)}
										{#if section.names[kind].length}
											<dt>{t.signups.kinds[kind]}</dt>
											<dd>{section.names[kind].join(', ')}</dd>
										{/if}
									{/each}
								</dl>
							</details>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted">{t.signups.noOne}</p>
		{/if}
		{#if signups.comments.length}
			<h3>{t.signups.comments}</h3>
			<ul class="comments">
				{#each signups.comments as comment, i (i)}<li><strong>{comment.name}:</strong> {comment.comment}</li>{/each}
			</ul>
		{/if}
	</details>
</section>

<style>
	.signups {
		display: grid;
		gap: var(--space-3);
		margin-bottom: var(--space-6);
		padding: var(--space-4) var(--space-5);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-l);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.coverage {
		padding-top: var(--space-2);
		border-top: 1px solid var(--hairline);
	}

	.coverage summary {
		flex-wrap: wrap;
		column-gap: var(--space-3);
		font-size: 0.9375rem;
	}

	.coverage[open] summary {
		margin-bottom: var(--space-2);
	}

	.summary {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 400;
	}

	h2 {
		margin: 0 0 var(--space-2);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	h3 {
		margin: var(--space-3) 0 var(--space-1);
		font-size: 0.875rem;
	}

	/* One segmented control: three equal parts that never wrap, the chosen one raised. */
	.answers {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 2px;
		padding: 3px;
		border-radius: 14px;
		background: var(--surface-2);
	}

	.answer {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-width: 0;
		height: calc(var(--tap) - 4px);
		padding: 0 var(--space-2);
		border: 0;
		border-radius: 11px;
		background: transparent;
		color: var(--text-muted);
		transition:
			background var(--fast) var(--ease),
			color var(--fast) var(--ease),
			box-shadow var(--fast) var(--ease),
			transform var(--fast) var(--ease);
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
	}

	.answer:hover:not(.chosen) {
		color: var(--text);
	}

	.answer:active {
		transform: scale(0.97);
	}

	/* Raised and tinted in the answer's colour, so it reads as chosen in light and dark. */
	.answer.chosen {
		--tone: var(--accent);
		background: color-mix(in oklab, var(--tone) 18%, var(--surface));
		color: var(--tone);
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.12),
			inset 0 0 0 1px color-mix(in oklab, var(--tone) 35%, transparent);
	}

	.answer.yes.chosen {
		--tone: var(--ok);
	}

	.answer.maybe.chosen {
		--tone: var(--warn);
	}

	.answer.no.chosen {
		--tone: var(--danger);
	}

	/* On narrow phones the words carry it; the icons would push "Ich kann nicht" off its part. */
	@media (max-width: 400px) {
		.answer {
			font-size: 0.875rem;
		}

		.answer :global(svg) {
			display: none;
		}
	}

	.answer:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.msg {
		margin-top: var(--space-2);
	}

	.details {
		margin-top: var(--space-3);
		font-size: 0.875rem;
	}

	.details summary {
		color: var(--text-muted);
		cursor: pointer;
	}

	.details-form {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: var(--space-2) var(--space-3);
		margin: var(--space-3) 0 var(--space-2);
	}

	.grow {
		flex: 1;
		min-width: 180px;
	}

	.link {
		padding: 0;
		border: 0;
		background: none;
		color: var(--text-muted);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}

	.muted {
		margin: 0 0 var(--space-2);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.sections,
	.comments {
		display: grid;
		gap: var(--space-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.sections li {
		display: grid;
		grid-template-columns: minmax(90px, 140px) 1fr auto auto;
		align-items: center;
		gap: var(--space-1) var(--space-3);
		font-size: 0.875rem;
	}

	.label {
		font-weight: 600;
	}

	.bar {
		display: flex;
		height: 8px;
		overflow: hidden;
		border-radius: 999px;
		background: var(--surface-2);
	}

	.bar .yes {
		background: var(--ok);
	}

	.bar .maybe {
		background: color-mix(in oklab, var(--warn) 60%, transparent);
	}

	.count {
		min-width: 3.5em;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.uncovered .label,
	.uncovered .count {
		color: var(--danger);
	}

	.names {
		display: contents;
	}

	.names summary {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 6px;
		color: var(--text-muted);
		list-style: none;
		cursor: pointer;
	}

	.names summary::-webkit-details-marker {
		display: none;
	}

	.names dl {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 2px var(--space-3);
		margin: 0 0 var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-radius: 8px;
		background: var(--surface-2);
	}

	.names dt {
		color: var(--text-muted);
	}

	.names dd {
		margin: 0;
	}

	.comments {
		font-size: 0.875rem;
	}

	@media (min-width: 800px) {
		.signups {
			grid-template-columns: minmax(260px, 1fr) 1.4fr;
			align-items: start;
		}
	}
</style>
