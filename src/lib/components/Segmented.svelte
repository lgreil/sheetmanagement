<script lang="ts" generics="T extends string">
	import Icon, { type IconName } from './Icon.svelte';

	/** A few mutually exclusive choices side by side, like a filter or a view. */
	let {
		options,
		value = $bindable(),
		label,
		iconOnly = false,
		onchange
	}: {
		options: { value: T; label: string; icon?: IconName }[];
		value: T;
		/** Names the group for screen readers. */
		label: string;
		/** Icons only (each option's label becomes its tooltip). */
		iconOnly?: boolean;
		onchange?: (value: T) => void;
	} = $props();

	function choose(next: T) {
		value = next;
		onchange?.(next);
	}
</script>

<div class="segmented" role="radiogroup" aria-label={label}>
	{#each options as option (option.value)}
		<button
			type="button"
			role="radio"
			aria-checked={value === option.value}
			aria-label={iconOnly ? option.label : undefined}
			title={iconOnly ? option.label : undefined}
			class:active={value === option.value}
			class:icon-only={iconOnly}
			onclick={() => choose(option.value)}
		>
			{#if option.icon}<Icon name={option.icon} size={16} />{/if}
			{#if !iconOnly}<span>{option.label}</span>{/if}
		</button>
	{/each}
</div>

<style>
	.segmented {
		display: inline-grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		max-width: 100%;
		padding: 3px;
		border-radius: 12px;
		background: var(--surface-2);
	}

	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-width: 0;
		min-height: 34px;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: 9px;
		background: none;
		color: var(--text-muted);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background var(--fast) var(--ease),
			color var(--fast) var(--ease),
			box-shadow var(--fast) var(--ease);
	}

	button.icon-only {
		padding: 0 10px;
	}

	span {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	button:hover {
		color: var(--text);
	}

	button.active {
		background: var(--surface);
		color: var(--text);
		box-shadow:
			0 1px 3px rgb(0 0 0 / 0.12),
			0 0 0 0.5px rgb(0 0 0 / 0.04);
	}

	@media (pointer: coarse) {
		button {
			min-height: 38px;
		}
	}
</style>
