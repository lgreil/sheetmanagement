<script lang="ts">
	import { enhance } from '$app/forms';
	import { config } from '#lib/config/index.ts';
	import { t } from '#lib/i18n/index.ts';
	import { checkSection } from '#lib/music/naming.ts';
	import { createInstrumentMatcher } from '#lib/music/part-name.ts';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();

	const matcher = createInstrumentMatcher(config.instruments);
	/** Short titles people changed, by section; the rest use the guess. */
	let shortTitles = $state<Record<string, string>>({});
	/** Files left out of a rename, by file id. */
	let skipped = $state<Record<string, boolean>>({});
	let filter = $state<'all' | 'rename' | 'unclear'>('rename');
	let busy = $state<string | null>(null);

	// Recomputed whenever a short title changes, with the same code the server uses before renaming.
	const sections = $derived(
		data.sections.map((section) => {
			const shortTitle = shortTitles[section.key] ?? section.shortTitle;
			const checks = checkSection(section.files, shortTitle, config.naming, matcher, {
				movement: section.movement,
				titles: section.titles
			}).filter((check) => check.state === 'rename' || check.state === 'unclear');
			const chosen = checks.filter((check) => check.state === 'rename' && !skipped[check.id]);
			return { ...section, shortTitle, checks, chosen };
		})
	);
	const shown = $derived(
		sections.filter((section) =>
			filter === 'all' ? section.checks.length : section.checks.some((check) => check.state === filter)
		)
	);

	const submit = (key: string) => () => {
		busy = key;
		return async ({ update }: { update: (options?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = null;
		};
	};
</script>

<Title title={t.naming.title} />
<PageHeader title={t.naming.title} lead={t.naming.lead} />

{#if !data.ok}
	<p class="msg error">{t.naming.failedLoad}</p>
{:else if !data.sections.length}
	<p class="msg ok"><Icon name="check" size={16} />{t.naming.none}</p>
{:else}
	<p class="summary">{t.naming.counts(data.counts.rename, data.counts.unclear, data.counts.folders)}</p>
	{#if !data.driveWrite}<p class="msg info">{t.naming.noDriveWrite}</p>{/if}

	<div class="filters" role="tablist">
		{#each ['rename', 'unclear', 'all'] as const as key (key)}
			<button role="tab" class="filter" class:active={filter === key} aria-selected={filter === key} onclick={() => (filter = key)}>
				{t.naming.filter[key]}
			</button>
		{/each}
	</div>

	<ul class="sections">
		{#each shown as section (section.key)}
			<li class="section">
				<div class="head">
					<a class="folder" href="/stuecke/{encodeURIComponent(section.pieceId)}">{section.folderName}</a>
					{#if section.section}<span class="tag">{section.section}</span>{/if}
				</div>

				<form method="POST" action="?/rename" use:enhance={submit(section.key)}>
					<input type="hidden" name="key" value={section.key} />
					<label class="short">
						<span>{t.naming.shortTitle}</span>
						<input
							name="shortTitle"
							value={section.shortTitle}
							maxlength="120"
							autocomplete="off"
							title={t.naming.shortTitleHint}
							oninput={(event) => (shortTitles[section.key] = event.currentTarget.value)}
						/>
						{#if section.shortTitle.length > 24}<span class="warn">{t.naming.long}</span>{/if}
					</label>

					<ul class="files">
						{#each section.checks as check (check.id)}
							<li class:unclear={check.state === 'unclear'}>
								{#if check.state === 'rename'}
									<label class="file">
										<input
											type="checkbox"
											name="id"
											value={check.id}
											checked={!skipped[check.id]}
											onchange={(event) => (skipped[check.id] = !event.currentTarget.checked)}
										/>
										<span class="names">
											<span class="old">{check.name}</span>
											<span class="new"><Icon name="arrow" size={14} />{check.suggested}</span>
										</span>
									</label>
								{:else}
									<div class="file">
										<span class="badge">{t.naming.unclear}</span>
										<span class="names">
											<span>{check.name}</span>
											<span class="muted">{t.naming.unclearHint(check.unrecognized.join(', '))}</span>
										</span>
									</div>
								{/if}
							</li>
						{/each}
					</ul>

					{#if form?.key === section.key && form.message}
						<p class="msg error" role="alert">{form.message}</p>
					{:else if form?.key === section.key && form.renamed}
						<p class="msg ok" role="status"><Icon name="check" size={16} />{t.naming.renamed(form.renamed)}</p>
					{/if}
					{#if section.chosen.length}
						<button class="btn" disabled={!data.driveWrite || busy !== null || section.chosen.length > data.maxRenames}>
							<Icon name="check" size={16} />{t.naming.rename(section.chosen.length)}
						</button>
					{/if}
				</form>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.msg {
		margin-bottom: var(--space-4);
	}

	.summary {
		margin-bottom: var(--space-3);
		color: var(--text-muted);
	}

	.filters {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
		overflow-x: auto;
	}

	.filter {
		padding: 6px 14px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
	}

	.filter.active {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.sections {
		display: grid;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.section {
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.folder {
		font-weight: 600;
	}

	.folder:hover {
		color: var(--accent);
	}

	.tag {
		padding: 0 var(--space-2);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 600;
	}

	form {
		display: grid;
		gap: var(--space-3);
	}

	.short {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.short input {
		flex: 1 1 220px;
		max-width: 360px;
		padding: 6px 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius-s);
		background: var(--bg);
		color: var(--text);
		font: inherit;
		font-weight: 400;
	}

	.warn {
		color: var(--warn);
		font-size: 0.8125rem;
	}

	.files {
		display: grid;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.875rem;
	}

	.file {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-s);
	}

	label.file {
		cursor: pointer;
	}

	label.file:hover {
		background: var(--surface-2);
	}

	.file input {
		margin-top: 3px;
		accent-color: var(--accent);
	}

	.names {
		display: grid;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.old {
		color: var(--text-muted);
		text-decoration: line-through;
		text-decoration-color: color-mix(in oklab, var(--text-muted) 50%, transparent);
	}

	.new {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-weight: 600;
	}

	.badge {
		flex: none;
		padding: 0 6px;
		border-radius: 6px;
		background: color-mix(in oklab, var(--warn) 14%, transparent);
		color: var(--warn);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.muted {
		color: var(--text-muted);
	}

	.btn {
		justify-self: start;
	}
</style>
