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

	/** Like any radio group: one tab stop, the arrow keys move between the choices (#141). */
	function onkeydown(event: KeyboardEvent) {
		const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
		if (!step) return;
		event.preventDefault();
		const index = options.findIndex((option) => option.value === value);
		const next = options[(index + step + options.length) % options.length];
		choose(next.value);
		const group = event.currentTarget as HTMLElement;
		requestAnimationFrame(() => group.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
	}
</script>

<div
	class="segmented"
	role="radiogroup"
	aria-label={label}
	tabindex="-1"
	{onkeydown}
	style:--count={options.length}
	style:--index={Math.max(0, options.findIndex((option) => option.value === value))}
>
	<!-- One raised thumb that slides to the choice, instead of each button lighting up. -->
	<span class="thumb" aria-hidden="true"></span>
	{#each options as option (option.value)}
		<button
			type="button"
			role="radio"
			aria-checked={value === option.value}
			tabindex={value === option.value ? 0 : -1}
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
		position: relative;
		isolation: isolate;
		display: inline-grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		max-width: 100%;
		padding: 3px;
		border-radius: var(--radius-control);
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
		border-radius: var(--radius-s);
		background: none;
		color: var(--text-muted);
		font: inherit;
		font-size: var(--text-sm);
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
		color: var(--text);
	}

	button :global(svg) {
		transition: transform var(--fast) var(--ease);
	}

	button.active :global(svg) {
		transform: scale(1.1);
	}

	.thumb {
		position: absolute;
		top: 3px;
		bottom: 3px;
		left: 3px;
		z-index: -1;
		width: calc((100% - 6px) / var(--count));
		border-radius: var(--radius-s);
		/* In dark mode the surface is barely lighter than the track: a lifted tone instead. */
		background: var(--surface-lifted);
		box-shadow:
			0 1px 3px rgb(0 0 0 / 0.12),
			0 0 0 0.5px rgb(0 0 0 / 0.04);
		transform: translateX(calc(var(--index) * 100%));
		/* Glides to the chosen option on the app's one curve, like a switch settling. */
		transition:
			transform 0.28s var(--ease),
			scale var(--fast) var(--ease),
			background 0.35s var(--ease);
	}

	/* Pressing gives way slightly before the thumb moves. */
	.segmented:active .thumb {
		scale: 0.97;
	}

	@media (pointer: coarse) {
		button {
			min-height: 38px;
		}
	}
</style>
