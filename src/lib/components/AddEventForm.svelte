<script lang="ts">
	import { enhance } from '$app/forms';
	import { config } from '#lib/config/index.ts';
	import { NEW_EVENT_TYPES, type NewEventType } from '#lib/events/new-event.ts';
	import { FormState } from '#lib/forms.svelte.ts';
	import { t } from '#lib/i18n/index.ts';
	import Icon from './Icon.svelte';
	import Segmented from './Segmented.svelte';

	/**
	 * A concert or rehearsal straight into the Google Calendar, for those who plan dates
	 * ("termine.planen"). While the app may only read the calendar, it says what to set up.
	 */
	let {
		writable,
		concerts,
		open = $bindable(false),
		result,
		preset = {}
	}: {
		writable: boolean;
		concerts: { id: string; title: string; date: string }[];
		open?: boolean;
		result?: { eventError?: string; eventValues?: Record<string, string>; eventAdded?: { id: string; title: string } } | null;
		/** Filled in from a link, e.g. a rehearsal for one concert. */
		preset?: { type?: string; concert?: string };
	} = $props();

	const saving = new FormState();
	const values = $derived<Record<string, string | undefined>>(result?.eventValues ?? preset);
	// svelte-ignore state_referenced_locally
	let type = $state<NewEventType>(NEW_EVENT_TYPES.find((value) => value === values.type) ?? 'probe');
	const word = (type: NewEventType) => {
		const first = config.events[type][0] ?? type;
		return first.charAt(0).toUpperCase() + first.slice(1);
	};
	const types = NEW_EVENT_TYPES.map((value) => ({ value, label: t.concerts.types[value] }));
	// A refused entry opens again, with what was typed.
	$effect(() => {
		if (result?.eventError) open = true;
	});
</script>

{#if open}
<section class="ui-card add" aria-labelledby="add-event-title">
	<div class="head">
		<h2 id="add-event-title">{t.calendar.add.open}</h2>
		<button type="button" class="close" aria-label={t.nav.close} title={t.nav.close} onclick={() => (open = false)}><Icon name="x" size={18} /></button>
	</div>
	{#if !writable}
		<p class="msg info">{t.calendar.add.readOnly}</p>
	{:else}
		<form method="POST" action="?/addEvent" use:enhance={saving.submit({ reset: true })}>
			<div class="type">
				<Segmented options={types} bind:value={type} label={t.calendar.add.type} />
				<input type="hidden" name="type" value={type} />
			</div>
			<label class="field">
				{t.calendar.add.title}
				<input
					name="title"
					maxlength="120"
					required={type === 'konzert'}
					value={values.title ?? ''}
					placeholder={type === 'konzert' ? t.calendar.add.concertHint : t.calendar.add.untitled(word(type))}
					autocomplete="off"
				/>
			</label>
			<div class="when">
				<label class="field date">{t.calendar.add.date}<input type="date" name="date" required value={values.date ?? ''} /></label>
				<label class="field">{t.calendar.add.start}<input type="time" name="start" step="900" value={values.start ?? ''} /></label>
				<label class="field">{t.calendar.add.end}<input type="time" name="end" step="900" value={values.end ?? ''} /></label>
			</div>
			<p class="hint">{t.calendar.add.timeHint}</p>
			<label class="field">
				{t.calendar.add.location}
				<input name="location" maxlength="200" value={values.location ?? ''} placeholder={t.calendar.add.locationHint} autocomplete="street-address" />
			</label>
			{#if type !== 'konzert' && concerts.length}
				<label class="field">
					{t.calendar.add.concert}
					<select name="concert" value={values.concert ?? concerts[0].id}>
						{#each concerts as concert (concert.id)}<option value={concert.id}>{concert.title} · {concert.date}</option>{/each}
						<option value="">{t.calendar.add.noConcert}</option>
					</select>
				</label>
			{/if}
			<!-- Rarely needed, so folded away. -->
			<details class="more" open={!!(values.description || values.tentative)}>
				<summary><Icon name="chevron" size={14} />{t.calendar.add.more}</summary>
				<label class="field">{t.calendar.add.description}<textarea name="description" maxlength="2000" rows="2">{values.description ?? ''}</textarea></label>
				<label class="check"><input type="checkbox" name="tentative" checked={!!values.tentative} />{t.calendar.add.tentative}</label>
			</details>
			{#if result?.eventError}<p class="msg error" role="alert">{result.eventError}</p>{/if}
			{#if result?.eventAdded}
				<p class="msg ok added" role="status">
					<Icon name="check" size={16} /><span>{t.calendar.add.added(result.eventAdded.title)}</span>
					<a href="/kalender/{encodeURIComponent(result.eventAdded.id)}">{t.calendar.add.show}</a>
				</p>
			{/if}
			<div>
				<button class="btn" disabled={saving.busy}><Icon name="calendar" size={16} />{t.calendar.add.save}</button>
			</div>
			<p class="hint">{t.calendar.add.lead}</p>
		</form>
	{/if}
</section>
{/if}

<style>
	.add {
		padding: var(--space-4);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.head h2 {
		font-size: 1.0625rem;
	}

	.close {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border: 0;
		border-radius: 999px;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}

	.close:hover {
		background: var(--surface-2);
		color: var(--text);
	}

	form {
		display: grid;
		gap: var(--space-3);
	}

	.hint {
		margin-top: calc(-1 * var(--space-2));
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.type :global(.segmented) {
		width: 100%;
	}

	.more {
		display: grid;
		gap: var(--space-3);
	}

	.more[open] {
		gap: var(--space-3);
	}

	.more summary {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 600;
		list-style: none;
		cursor: pointer;
	}

	.more summary::-webkit-details-marker {
		display: none;
	}

	.more summary :global(svg) {
		transition: transform var(--fast) var(--ease);
	}

	.more[open] summary {
		margin-bottom: var(--space-3);
	}

	.more[open] summary :global(svg) {
		transform: rotate(90deg);
	}

	.more .check {
		margin-top: var(--space-3);
	}

	.when {
		display: grid;
		grid-template-columns: minmax(150px, 2fr) minmax(96px, 1fr) minmax(96px, 1fr);
		gap: var(--space-2);
	}

	.added span {
		flex: 1;
	}

	.added a {
		color: var(--accent);
		font-weight: 650;
	}

	.check {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.9375rem;
	}

	.check input {
		width: 18px;
		height: 18px;
		accent-color: var(--accent);
	}

	@media (max-width: 560px) {
		.when {
			grid-template-columns: 1fr 1fr;
		}

		.when .date {
			grid-column: 1 / -1;
		}
	}
</style>
