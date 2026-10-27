<script lang="ts">
	import { enhance } from '$app/forms';
	import { config } from '#lib/config/index.ts';
	import { FormState } from '#lib/forms.svelte.ts';
	import { t } from '#lib/i18n/index.ts';
	import { optionLabel, type Poll } from '#lib/polls/polls.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Nothing from '#lib/components/Nothing.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
	const saving = new FormState();

	// The new poll's dates, edited here until it's started: three empty rows to begin with.
	let rows = $state([{ key: 1 }, { key: 2 }, { key: 3 }]);
	let next = 4;
	let adding = $state(false);

	const day = (date: string) => optionLabel({ id: '', date }, config.locale);
	const range = (poll: Poll) => {
		const first = day(poll.options[0].date);
		const last = day(poll.options[poll.options.length - 1].date);
		return poll.options.length > 1 ? `${first.day}. ${first.month} – ${last.day}. ${last.month}` : `${first.day}. ${first.month}`;
	};
</script>

<Title title={t.polls.title} />
<PageHeader title={t.polls.title} lead={t.polls.lead} />

{#if data.state === 'not-set-up'}
	<p class="msg info">{t.polls.notSetUp}</p>
{:else}
	{#if data.plans}
		<!-- Starting a poll: what it's about, a few dates, and who's asked. -->
		<details class="ui-card new" bind:open={adding}>
			<summary><Icon name="plus" size={18} />{t.polls.new}</summary>
			<form method="POST" action="?/create" use:enhance={saving.submit()}>
				<label class="field">
					{t.polls.fields.title}
					<input name="title" required maxlength="120" placeholder={t.polls.fields.titleHint} autocomplete="off" />
				</label>
				<fieldset class="dates">
					<legend>{t.polls.fields.dates}</legend>
					{#each rows as row, i (row.key)}
						<div class="date-row">
							<!-- The first row says what the fields are; the others only to screen readers. -->
							<label class="field"><span class:sr-only={i > 0}>{t.polls.fields.date}</span><input type="date" name="date" /></label>
							<label class="field"><span class:sr-only={i > 0}>{t.polls.fields.start}</span><input type="time" name="start" step="900" /></label>
							<label class="field"><span class:sr-only={i > 0}>{t.polls.fields.end}</span><input type="time" name="end" step="900" /></label>
							{#if rows.length > 2}
								<button type="button" class="remove" aria-label={t.polls.fields.removeDate} title={t.polls.fields.removeDate} onclick={() => rows.splice(i, 1)}>
									<Icon name="x" size={16} />
								</button>
							{/if}
						</div>
					{/each}
					<button type="button" class="add" onclick={() => rows.push({ key: next++ })}><Icon name="plus" size={16} />{t.polls.fields.addDate}</button>
				</fieldset>
				<fieldset class="groups">
					<legend>{t.polls.fields.groups}</legend>
					{#each data.groups as group (group)}
						<label class="chip"><input type="checkbox" name="groups" value={group} /><span>{group}</span></label>
					{/each}
				</fieldset>
				<div class="row">
					<label class="field">{t.polls.fields.deadline}<input type="date" name="deadline" /></label>
				</div>
				<label class="field">{t.polls.fields.note}<textarea name="note" maxlength="1000" rows="2"></textarea></label>
				{#if form?.error}<p class="msg error" role="alert">{form.error}</p>{/if}
				<div>
					<button class="btn" disabled={saving.busy}><Icon name="poll" size={16} />{t.polls.create}</button>
				</div>
			</form>
		</details>
	{/if}

	{#snippet list(polls: typeof data.open, open: boolean)}
		<ul class="ui-list polls">
			{#each polls as poll (poll.id)}
				<li>
					<a class="poll" href="/termine/{poll.id}">
						<span class="badge" class:done={!open}><Icon name="poll" size={20} /></span>
						<span class="body">
							<span class="title">{poll.title}</span>
							<span class="meta">
								{range(poll)} · {t.polls.answers(poll.answers)} · {t.polls.forGroups(poll.groups.join(', '))}
							</span>
						</span>
						{#if open && !poll.answered}<span class="pill todo">{t.polls.yourTurn}</span>{/if}
						<span class="chevron"><Icon name="chevron" size={16} /></span>
					</a>
				</li>
			{/each}
		</ul>
	{/snippet}

	{#if data.open.length}
		<h2 class="ui-label">{t.polls.open}</h2>
		{@render list(data.open, true)}
	{:else}
		<Nothing text={t.polls.empty} glyphs={['trumpet', 'violin', 'flute']} />
	{/if}
	{#if data.closed.length}
		<h2 class="ui-label closed">{t.polls.closed}</h2>
		{@render list(data.closed, false)}
	{/if}
{/if}

<style>
	.new {
		margin-bottom: var(--space-5);
		padding: 0;
	}

	.new summary {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		color: var(--accent);
		font-weight: 650;
		cursor: pointer;
		list-style: none;
	}

	.new summary::-webkit-details-marker {
		display: none;
	}

	.new form {
		display: grid;
		gap: var(--space-4);
		padding: 0 var(--space-4) var(--space-4);
	}

	fieldset {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend {
		margin-bottom: var(--space-1);
		color: var(--text-muted);
		font-size: var(--text-xs);
		font-weight: 600;
	}

	.date-row {
		display: grid;
		grid-template-columns: minmax(140px, 2fr) minmax(96px, 1fr) minmax(96px, 1fr) 40px;
		align-items: end;
		gap: var(--space-2);
	}

	.remove,
	.add {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		border: 0;
		background: none;
		color: var(--text-muted);
		font: inherit;
		cursor: pointer;
	}

	.remove {
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-control);
	}

	.remove:hover {
		background: color-mix(in oklab, var(--danger) 12%, transparent);
		color: var(--danger);
	}

	.add {
		justify-self: start;
		padding: var(--space-1) 0;
		color: var(--accent);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.groups {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.groups legend {
		width: 100%;
	}

	.chip {
		position: relative;
		cursor: pointer;
	}

	.chip input {
		position: absolute;
		inset: 0;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}

	.chip span {
		display: inline-flex;
		align-items: center;
		height: 36px;
		padding: 0 var(--space-3);
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		background: var(--bg);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.chip input:checked + span {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
	}

	.chip input:focus-visible + span {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.row {
		display: flex;
		gap: var(--space-3);
	}

	.closed {
		margin-top: var(--space-6);
	}

	.poll {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		transition: background var(--fast) var(--ease);
	}

	.poll:hover {
		background: var(--surface-2);
	}

	.badge {
		display: grid;
		place-items: center;
		flex: none;
		width: 42px;
		height: 42px;
		border-radius: var(--radius-control);
		background: var(--accent-soft);
		color: var(--accent);
	}

	.badge.done {
		background: var(--surface-2);
		color: var(--text-muted);
	}

	.body {
		display: grid;
		flex: 1;
		min-width: 0;
	}

	.title {
		font-weight: 650;
	}

	.meta {
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.pill.todo {
		flex: none;
		padding: 2px var(--space-2);
		border-radius: var(--radius-pill);
		background: var(--accent);
		color: var(--accent-contrast);
		font-size: var(--text-2xs);
		font-weight: 700;
	}

	.chevron {
		display: grid;
		flex: none;
		color: var(--text-muted);
	}

	@media (max-width: 560px) {
		.date-row {
			grid-template-columns: 1fr 1fr 40px;
		}

		.date-row .field:first-child {
			grid-column: 1 / -1;
		}
	}
</style>
