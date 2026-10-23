<script lang="ts">
	import { glyphOf } from '#lib/music/instrument-glyph.ts';
	import { instrumentLabel } from '#lib/music/instrument-label.ts';
	import InstrumentGlyph from './InstrumentGlyph.svelte';
	import { enhance } from '$app/forms';
	import { FormState } from '#lib/forms.svelte.ts';
	import { t } from '#lib/i18n/index.ts';
	import { ANSWERS } from '#lib/signups/signups.ts';
	import type { PageData } from '../../routes/kalender/[id]/$types';
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
	// The tapped answer shows as chosen at once; the sheet catches up in the background.
	let tapped = $state<string | null>(null);
	const submit = saving.submit({
		onStart: ({ submitter }) => (tapped = submitter?.getAttribute('name') === 'answer' ? submitter.getAttribute('value') : null)
	});
	const chosen = $derived((saving.busy && tapped) || signups.mine?.answer);

	const ICONS = { yes: 'check', maybe: 'minus', no: 'x' } as const;
	const KINDS = ['yes', 'maybe', 'no', 'open'] as const;
	const mine = $derived(signups.mine);
	const otherSections = $derived(signups.instruments.filter((name) => !signups.ownSections.includes(name)));
</script>

<section class="signups" id="anmeldung" aria-labelledby="signups-title">
	<h2 class="ui-label" id="signups-title">{t.signups.question}</h2>
	<div class="ui-card card">
		<form class="answers" method="POST" action="?/answer" use:enhance={submit}>
			{#each ANSWERS as answer (answer)}
				<button
					class="answer {answer}"
					class:chosen={chosen === answer}
					aria-pressed={chosen === answer}
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
					{t.signups.details}{mine.instrument ? ` · ${mine.instrument}` : ''}{mine.comment ? ` · ${t.common.quote(mine.comment)}` : ''}
				</summary>
				<form class="details-form" method="POST" action="?/answer" use:enhance={submit}>
					<input type="hidden" name="answer" value={mine.answer} />
					<label class="field">
						{t.signups.instrument}
						<select name="instrument" value={mine.instrument}>
							<option value="">{t.signups.ownInstrument(signups.ownInstrument)}</option>
							{#each signups.ownSections as name (name)}<option value={name}>{name}</option>{/each}
							<optgroup label="…">
								{#each otherSections as name (name)}<option value={name}>{instrumentLabel(name)}</option>{/each}
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
						<span class="label"><InstrumentGlyph glyph={glyphOf(section.label)} size={18} />{section.label}</span>
						<span class="bar" aria-hidden="true">
							<span class="yes" style:width="{expected ? (section.counts.yes / expected) * 100 : 0}%"></span>
							<span class="maybe" style:width="{expected ? (section.counts.maybe / expected) * 100 : 0}%"></span>
						</span>
						<span class="count">
							{#if section.counts.yes === 0}{t.signups.uncovered}{:else}{section.counts.yes}/{expected}{/if}
						</span>
						{#if section.names}
							<!-- Who it is, right under the bar: no second level to open. -->
							<p class="names">
								{#each KINDS.filter((kind) => section.names?.[kind].length) as kind (kind)}
									<span class="who {kind}"><span class="kind">{t.signups.kinds[kind]}:</span> {section.names[kind].join(', ')}</span>
								{/each}
							</p>
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
	</div>
</section>

<style>
	.signups {
		margin-bottom: var(--space-6);
	}

	/* One column at every width: the answer first, then who else comes. */
	.card {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-4);
	}

	.coverage {
		margin: 0 calc(-1 * var(--space-4)) calc(-1 * var(--space-4));
		padding: var(--space-1) var(--space-4) var(--space-2);
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

	/* While saving, the chosen answer already shows; only the others step back. */
	.answer:disabled {
		cursor: progress;
	}

	.answer:disabled:not(.chosen) {
		opacity: 0.6;
	}

	.details {
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
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.sections li {
		display: grid;
		grid-template-columns: minmax(90px, 140px) 1fr auto;
		align-items: center;
		gap: 2px var(--space-3);
		font-size: 0.875rem;
	}

	.label {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 600;
	}

	.label :global(svg) {
		flex: none;
		color: var(--text-muted);
	}

	.bar {
		display: flex;
		height: 8px;
		overflow: hidden;
		border-radius: 999px;
		background: var(--surface-2);
	}

	.bar span {
		transition: width 0.4s var(--ease);
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
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		gap: 0 var(--space-3);
		margin: 0;
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.kind {
		font-weight: 600;
	}

	.who.yes .kind {
		color: var(--ok);
	}

	.comments {
		gap: var(--space-1);
		font-size: 0.875rem;
	}
</style>
