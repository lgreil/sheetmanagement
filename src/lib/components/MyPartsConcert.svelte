<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import { mergedFileName } from '#lib/music/my-parts.ts';
	import type { PageData } from '../../routes/meine-noten/$types';
	import Icon from './Icon.svelte';

	/** One concert on "Meine Noten": its programme with the member's parts, and the merged PDF. */
	let {
		concert,
		choice,
		canMerge
	}: { concert: PageData['concerts'][number]; choice: PageData['choice']; canMerge: boolean } = $props();

	type Piece = (typeof concert.pieces)[number];
	type Shown = Piece['own'][number];
	/** Per piece: its own parts, or the shared ones when there is no own part. */
	const playable = (piece: Piece): Shown[] => {
		const ok = (parts: Shown[]) => parts.filter((part) => part.pdf && part.status === 'ok');
		return ok(piece.own).length ? ok(piece.own) : ok(piece.shared);
	};
	const files = $derived(concert.pieces.flatMap((piece) => playable(piece).map((part) => ({ ...part, piece: piece.title }))));
	const found = $derived(concert.pieces.filter((piece) => piece.own.length || piece.shared.length).length);

	let progress = $state<string | null>(null);
	let mergeError = $state<string | null>(null);
	/** Parts left out of the last merge, and why, so a broken file can be found and fixed. */
	let skipped = $state<{ piece: string; label: string; reason: string }[]>([]);

	/** The part's pages, or why it couldn't be added. */
	async function loadPart(PDFDocument: typeof import('pdf-lib').PDFDocument, id: string) {
		let response: Response;
		try {
			response = await fetch(`/api/noten/${encodeURIComponent(id)}`);
		} catch {
			return { reason: t.myParts.skipOffline };
		}
		if (!response.ok) {
			const body = await response.text().catch(() => '');
			let message = '';
			try {
				message = JSON.parse(body).message ?? '';
			} catch {
				// Not SvelteKit's JSON error, e.g. a Cloudflare error page: the status says enough.
			}
			return { reason: t.myParts.skipHttp(response.status, message) };
		}
		try {
			return { doc: await PDFDocument.load(await response.arrayBuffer(), { ignoreEncryption: true }) };
		} catch (error) {
			console.error(error);
			return { reason: t.myParts.skipUnreadable };
		}
	}

	/** Merges the parts in the browser: Workers on the free plan have too little CPU time for it. */
	async function merge() {
		if (!choice) return;
		mergeError = null;
		skipped = [];
		try {
			progress = t.myParts.merging(0, files.length);
			const { PDFDocument } = await import('pdf-lib');
			const merged = await PDFDocument.create();
			// One broken file shouldn't cost the whole PDF: it's left out and named.
			for (const [i, file] of files.entries()) {
				progress = t.myParts.merging(i + 1, files.length);
				const part = await loadPart(PDFDocument, file.id);
				if (!part.doc) {
					skipped.push({ piece: file.piece, label: file.label, reason: part.reason });
					continue;
				}
				try {
					for (const page of await merged.copyPages(part.doc, part.doc.getPageIndices())) merged.addPage(page);
				} catch (error) {
					console.error(error);
					skipped.push({ piece: file.piece, label: file.label, reason: t.myParts.skipUnreadable });
				}
			}
			if (merged.getPageCount() === 0) {
				mergeError = t.myParts.mergeFailed;
				return;
			}
			const blob = new Blob([(await merged.save()) as BlobPart], { type: 'application/pdf' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = mergedFileName(concert.title, choice.label);
			link.click();
			setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
		} catch (error) {
			// Loading pdf-lib failed (offline, or an old cached page after a deploy).
			console.error(error);
			mergeError = `${t.myParts.mergeFailed} ${error instanceof Error ? `(${error.message})` : ''}`;
		} finally {
			progress = null;
		}
	}
</script>

<section class="concert" id="konzert-{concert.id}">
	<div class="concert-head">
		<div>
			<a class="concert-title" href="/konzerte/{encodeURIComponent(concert.id)}">{concert.title}</a>
			{#if concert.label}<p class="muted">{concert.label}</p>{/if}
		</div>
		{#if choice && concert.pieces.length}
			<div class="merge">
				{#if canMerge}
					<button class="btn" onclick={merge} disabled={!!progress || !files.length} title={t.myParts.mergeHint}>
						<Icon name="file" size={16} />{progress ?? t.myParts.merge}
					</button>
				{:else}
					<span class="muted small">{t.myParts.mergeOff}</span>
				{/if}
				<span class="muted small">{t.myParts.summary(found, concert.pieces.length)}</span>
			</div>
		{/if}
	</div>
	{#if mergeError}<p class="msg error" role="alert">{mergeError}</p>{/if}
	{#if skipped.length}
		<div class="msg error skipped" role="alert">
			<p>{t.myParts.skipped(skipped.length)}</p>
			<ul>
				{#each skipped as part, i (i)}<li><strong>{part.piece}</strong> – {part.label}: {part.reason}</li>{/each}
			</ul>
		</div>
	{/if}

	{#if !concert.pieces.length}
		<p class="msg info">{t.myParts.noProgram}</p>
	{:else}
		<ol class="pieces">
			{#each concert.pieces as piece, i (i)}
				<li class="piece" class:none={choice && !piece.own.length && !piece.shared.length}>
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
						{:else if choice}
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
								<span class="hint warn"><Icon name="alert" size={14} />{t.myParts.noPart(choice.label)}</span>
							{/if}
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</section>

<style>
	.concert {
		scroll-margin-top: calc(var(--header-height) + var(--space-4));
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

	.skipped {
		display: grid;
		gap: var(--space-1);
	}

	.skipped ul {
		margin: 0;
		padding-left: var(--space-4);
		font-size: 0.875rem;
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
