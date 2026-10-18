<script lang="ts">
	import { enhance } from '$app/forms';
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
	let picking = $state(false);
	const showPicker = $derived(picking || !data.choice);

	type Shown = (typeof data.pieces)[number]['own'][number];
	/** Per piece: its own parts, or the shared ones when there is no own part. */
	const playable = (piece: (typeof data.pieces)[number]): Shown[] => {
		const ok = (parts: Shown[]) => parts.filter((part) => part.pdf && part.status === 'ok');
		return ok(piece.own).length ? ok(piece.own) : ok(piece.shared);
	};
	const files = $derived(data.pieces.flatMap(playable));
	const found = $derived(data.pieces.filter((piece) => piece.own.length || piece.shared.length).length);

	let progress = $state<string | null>(null);
	let mergeError = $state(false);

	/** Merges the parts in the browser: Workers on the free plan have too little CPU time for it. */
	async function merge() {
		if (!data.concert || !data.choice) return;
		mergeError = false;
		try {
			progress = t.myParts.merging(0, files.length);
			const { PDFDocument } = await import('pdf-lib');
			const merged = await PDFDocument.create();
			for (const [i, file] of files.entries()) {
				progress = t.myParts.merging(i + 1, files.length);
				const response = await fetch(`/api/noten/${encodeURIComponent(file.id)}`);
				if (!response.ok) throw new Error(`${response.status} for ${file.label}`);
				const part = await PDFDocument.load(await response.arrayBuffer(), { ignoreEncryption: true });
				for (const page of await merged.copyPages(part, part.getPageIndices())) merged.addPage(page);
			}
			const blob = new Blob([(await merged.save()) as BlobPart], { type: 'application/pdf' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = t.myParts.fileName(data.concert.title, data.choice.label);
			link.click();
			setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
		} catch (error) {
			console.error(error);
			mergeError = true;
		} finally {
			progress = null;
		}
	}
</script>

<Title title={t.myParts.title} />
<PageHeader title={t.myParts.title} lead={t.myParts.lead} />

<div class="controls">
	{#if showPicker}
		<form
			class="picker"
			method="POST"
			action="?/save"
			use:enhance={() =>
				async ({ update }) => {
					await update({ reset: false });
					picking = false;
				}}
		>
			<p class="muted wide">
				{data.unknown ? t.myParts.unknownInstrument(data.unknown) : t.myParts.pickInstrument}
			</p>
			<label class="field">
				{t.myParts.instrument}
				<select name="instrument" value={data.choice?.instrument ?? ''} required>
					<option value="" disabled>…</option>
					{#each data.choices as name (name)}<option value={name}>{name}</option>{/each}
				</select>
			</label>
			<label class="field narrow">
				{t.myParts.number}
				<select name="number" value={String(data.choice?.number ?? '')}>
					<option value="">{t.myParts.anyNumber}</option>
					{#each ['I', 'II', 'III', 'IV'] as roman, i (roman)}<option value={String(i + 1)}>{roman}</option>{/each}
				</select>
			</label>
			<button class="btn">{t.myParts.save}</button>
			{#if data.choice}<button class="btn ghost" type="button" onclick={() => (picking = false)}>{t.reports.cancel}</button>{/if}
		</form>
	{:else if data.choice}
		<div class="chip">
			<Icon name="user" size={16} />
			<strong>{data.choice.label}</strong>
			<button class="link" onclick={() => (picking = true)}>{t.myParts.change}</button>
			{#if form?.saved}<span class="muted">· {t.myParts.saved}</span>{/if}
		</div>
	{/if}

	{#if data.upcoming.length > 1}
		<form class="concert-picker" method="GET">
			<label class="field">
				{t.myParts.concert}
				<select name="konzert" value={data.concert?.id} onchange={(event) => event.currentTarget.form?.requestSubmit()}>
					{#each data.upcoming as concert (concert.id)}
						<option value={concert.id}>{concert.title}{concert.label ? ` · ${concert.label}` : ''}</option>
					{/each}
				</select>
			</label>
			<noscript><button class="btn ghost small">{t.myParts.show}</button></noscript>
		</form>
	{/if}
</div>

{#if !data.concert}
	<p class="msg info">{t.myParts.noConcert}</p>
{:else}
	<section class="concert">
		<div class="concert-head">
			<div>
				<a class="concert-title" href="/konzerte/{encodeURIComponent(data.concert.id)}">{data.concert.title}</a>
				{#if data.concert.label}<p class="muted">{data.concert.label.long}</p>{/if}
			</div>
			{#if data.choice && data.pieces.length}
				<div class="merge">
					{#if data.canMerge}
						<button class="btn" onclick={merge} disabled={!!progress || !files.length} title={t.myParts.mergeHint}>
							<Icon name="file" size={16} />{progress ?? t.myParts.merge}
						</button>
					{:else}
						<span class="muted small">{t.myParts.mergeOff}</span>
					{/if}
					<span class="muted small">{t.myParts.summary(found, data.pieces.length)}</span>
				</div>
			{/if}
		</div>
		{#if mergeError}<p class="msg error" role="alert">{t.myParts.mergeFailed}</p>{/if}

		{#if !data.pieces.length}
			<p class="msg info">{t.myParts.noProgram}</p>
		{:else}
			<ol class="pieces">
				{#each data.pieces as piece, i (i)}
					<li class="piece" class:none={data.choice && !piece.own.length && !piece.shared.length}>
						<span class="position">{piece.position ?? i + 1}</span>
						<div class="body">
							<div class="title">
								{#if piece.pieceId}
									<a href="/stuecke/{encodeURIComponent(piece.pieceId)}">{piece.title}</a>
								{:else}{piece.title}{/if}
								{#if piece.subtitle}<span class="muted">{piece.subtitle}</span>{/if}
								{#if piece.recording}
									<a class="listen" href={piece.recording} target="_blank" rel="noopener noreferrer nofollow" title={t.piece.recording}>
										<Icon name="headphones" size={14} />{t.piece.recording}
									</a>
								{/if}
							</div>
							{#if !piece.hasMusic}
								<span class="hint">{t.myParts.noMusic}</span>
							{:else if data.choice}
								{#if piece.own.length || piece.shared.length}
									<ul class="parts">
										{#each [...piece.own.map((p) => ({ ...p, shared: false })), ...piece.shared.map((p) => ({ ...p, shared: true }))] as part (part.id)}
											<li>
												<a class="part" class:problem={part.status !== 'ok'} href={part.url} target="_blank" rel="noopener noreferrer">
													<Icon name="file" size={16} />
													<span>{part.label}</span>
													{#if part.shared}<span class="tag">{t.myParts.shared}</span>{/if}
													{#if part.status !== 'ok'}<span class="tag warn">{t.piece.partStatus[part.status]}</span>{/if}
													{#each part.notes as note (note)}<span class="tag">{note}</span>{/each}
												</a>
											</li>
										{/each}
									</ul>
								{:else}
									<span class="hint warn"><Icon name="alert" size={14} />{t.myParts.noPart(data.choice.label)}</span>
								{/if}
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
{/if}

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}

	.picker {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: var(--space-3);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.picker .wide {
		flex-basis: 100%;
	}

	.narrow select {
		width: 90px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
	}

	.link {
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		font-size: 0.875rem;
		text-decoration: underline;
		cursor: pointer;
	}

	.concert-picker select {
		max-width: 320px;
	}

	.concert-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.concert-title {
		font-family: var(--font-serif);
		font-size: 1.375rem;
		font-weight: 600;
	}

	.merge {
		display: grid;
		justify-items: end;
		gap: var(--space-1);
	}

	.msg {
		margin-bottom: var(--space-4);
	}

	.pieces {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.piece {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.piece.none {
		border-style: dashed;
		background: transparent;
	}

	.position {
		display: grid;
		place-items: center;
		flex: none;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--surface-2);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 700;
	}

	.body {
		display: grid;
		gap: var(--space-2);
		flex: 1;
		min-width: 0;
	}

	.title {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-1) var(--space-2);
		font-weight: 600;
	}

	.title a:hover {
		color: var(--accent);
	}

	.title .listen {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--accent);
		font-size: 0.8125rem;
	}

	.parts {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.part {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1) var(--space-2);
		padding: 6px var(--space-3);
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--bg);
		color: var(--accent);
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.part:hover {
		border-color: color-mix(in oklab, var(--accent) 45%, var(--border));
	}

	.part.problem {
		border-style: dashed;
		color: var(--text-muted);
	}

	.tag {
		padding: 0 6px;
		border-radius: 6px;
		background: var(--surface-2);
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.tag.warn,
	.hint.warn {
		color: var(--warn);
	}

	.hint {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.muted {
		color: var(--text-muted);
		font-weight: 400;
	}

	.small {
		font-size: 0.8125rem;
	}
</style>
