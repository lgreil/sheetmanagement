<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import { PART_NUMBERS } from '#lib/music/my-parts.ts';
	import Icon from './Icon.svelte';
	import InstrumentSelect from './InstrumentSelect.svelte';

	/**
	 * Several instruments, each with none, one or several part numbers ("Geige I & II, Viola").
	 * Sends "instrument" once per row and "number" as "<row>:<n>"; the server reads them with
	 * choicesFromForm.
	 */
	let {
		choices = [],
		instruments,
		common,
		required = false
	}: {
		choices?: { instrument: string; numbers: number[] }[];
		instruments: string[];
		common: string[];
		required?: boolean;
	} = $props();

	const ROMAN = ['', 'I', 'II', 'III', 'IV'];
	// The form's own copy: rows are added and removed here until it's saved.
	// svelte-ignore state_referenced_locally
	let rows = $state(choices.length ? choices.map((c) => ({ instrument: c.instrument, numbers: [...c.numbers] })) : [{ instrument: '', numbers: [] as number[] }]);
</script>

<div class="picker">
	{#each rows as row, i (i)}
		<div class="row">
			<label class="field">
				{i === 0 ? t.myParts.instrument : ''}
				<InstrumentSelect
					name="instrument"
					bind:value={row.instrument}
					groups={[{ names: instruments }]}
					{common}
					required={required && i === 0}
					label={t.myParts.instrument}
				/>
			</label>
			<fieldset class="numbers" title={t.instruments.numbersHint}>
				<legend>{i === 0 ? t.instruments.numbers : ''}</legend>
				{#each PART_NUMBERS as n (n)}
					<label class="number">
						<input
							type="checkbox"
							name="number"
							value="{i}:{n}"
							checked={row.numbers.includes(n)}
							onchange={(event) =>
								(row.numbers = event.currentTarget.checked ? [...row.numbers, n] : row.numbers.filter((m) => m !== n))}
						/>
						<span>{ROMAN[n]}</span>
					</label>
				{/each}
			</fieldset>
			{#if rows.length > 1}
				<button class="remove" type="button" title={t.instruments.remove} aria-label={t.instruments.remove} onclick={() => rows.splice(i, 1)}>
					<Icon name="trash" size={16} />
				</button>
			{/if}
		</div>
	{/each}
	<button class="add" type="button" onclick={() => rows.push({ instrument: '', numbers: [] })}>
		<Icon name="plus" size={16} />{t.instruments.add}
	</button>
</div>

<style>
	.picker {
		display: grid;
		gap: var(--space-2);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: var(--space-2) var(--space-3);
	}

	.row .field {
		flex: 1;
		min-width: 160px;
	}

	.numbers {
		display: grid;
		grid-auto-flow: column;
		gap: var(--space-1);
		margin: 0;
		padding: 0;
		border: 0;
	}

	.numbers legend {
		padding: 0;
		margin-bottom: var(--space-1);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.number {
		position: relative;
		display: inline-grid;
		cursor: pointer;
	}

	.number input[type='checkbox'] {
		position: absolute;
		opacity: 0;
		inset: 0;
		margin: 0;
		cursor: pointer;
	}

	.number span {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--bg);
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 700;
	}

	.number input:checked + span {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
	}

	.number input:focus-visible + span {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
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
		font-size: 0.875rem;
		cursor: pointer;
	}

	.remove {
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
	}

	.remove:hover {
		background: color-mix(in oklab, var(--danger) 12%, transparent);
		color: var(--danger);
	}

	.add {
		justify-self: start;
		padding: var(--space-1) 0;
		color: var(--accent);
		font-weight: 600;
	}
</style>
