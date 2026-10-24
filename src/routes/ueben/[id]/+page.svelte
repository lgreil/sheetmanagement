<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Title from '#lib/components/Title.svelte';
	import type { OpenScore } from '#lib/music/score-reader.ts';
	import { BEAT_SECONDS, PracticeClock } from '#lib/practice/practice.ts';

	/**
	 * The practice viewer: the part's pages one below the other, drawn with pdf.js, while a
	 * clock counts the time they are open, visible and in use (see PracticeClock). Every 30
	 * seconds, and when the page is hidden or left, the counted seconds go to /api/ueben.
	 */
	let { data } = $props();

	let score = $state<OpenScore | null>(null);
	let pages = $state(0);
	let zoomed = $state(false);
	let failed = $state(false);
	let box = $state<HTMLDivElement>();
	let canvases = $state<HTMLCanvasElement[]>([]);
	let width = $state(0);

	$effect(() => {
		const id = data.file;
		let opened: OpenScore | null = null;
		let cancelled = false;
		failed = false;
		(async () => {
			try {
				const { openScore } = await import('#lib/music/score-reader.ts');
				opened = await openScore(id);
				if (cancelled) return void opened.destroy();
				score = opened;
				pages = opened.doc.numPages;
			} catch {
				if (!cancelled) failed = true;
			}
		})();
		return () => {
			cancelled = true;
			opened?.destroy();
		};
	});

	// All pages at the box's width (twice as wide when zoomed), one after the other.
	let drawing: Promise<unknown> = Promise.resolve();
	$effect(() => {
		if (!score || !width || canvases.length < pages) return;
		const [current, targets, size] = [score, canvases.slice(0, pages), Math.max(200, width - 2) * (zoomed ? 2 : 1)];
		drawing = drawing
			.then(() => import('#lib/music/score-reader.ts'))
			.then(async ({ renderPage }) => {
				for (const [i, canvas] of targets.entries()) await renderPage(current, i + 1, canvas, size);
			})
			.catch(() => (failed = true));
	});

	// The clock: ticks every 5 seconds, reports every 30.
	type Status = 'counting' | 'idle' | 'full' | 'stopped';
	let status = $state<Status>('counting');
	let today = $state(0);
	$effect(() => {
		today = data.todaySeconds;
		const clock = new PracticeClock(Date.now());
		let stopped = false;
		const visible = () => document.visibilityState === 'visible';
		const send = (keepalive = false) => {
			const seconds = clock.take();
			if (!seconds || stopped) return;
			today += seconds;
			fetch('/api/ueben', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ file: data.file, seconds }),
				keepalive
			})
				.then((response) => {
					// Turned off meanwhile (here or on another device), or not a part of their instrument.
					if (response.status === 409 || response.status === 403 || response.status === 404) {
						stopped = true;
						status = 'stopped';
					}
				})
				.catch(() => {});
		};
		const update = () => (status = stopped ? 'stopped' : clock.full() ? 'full' : clock.idle(Date.now()) ? 'idle' : 'counting');
		const tick = () => {
			clock.tick(Date.now(), visible());
			update();
		};
		const active = () => {
			// Back from a pause: the time while idle doesn't count, only from now on.
			if (clock.idle(Date.now())) clock.tick(Date.now(), false);
			clock.activity(Date.now());
			update();
		};
		const hidden = () => {
			tick();
			if (!visible()) send(true);
		};
		const ticker = setInterval(tick, 5000);
		const reporter = setInterval(() => send(), BEAT_SECONDS * 1000);
		const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
		for (const name of events) addEventListener(name, active, { passive: true });
		document.addEventListener('visibilitychange', hidden);
		addEventListener('pagehide', hidden);
		return () => {
			tick();
			send(true);
			clearInterval(ticker);
			clearInterval(reporter);
			for (const name of events) removeEventListener(name, active);
			document.removeEventListener('visibilitychange', hidden);
			removeEventListener('pagehide', hidden);
		};
	});
</script>

<Title title={t.practice.viewer.title(data.part, data.piece.title)} />

<div class="bar">
	<a class="back" href="/meine-noten"><Icon name="back" size={16} />{t.practice.viewer.back}</a>
	<div class="what">
		<strong>{data.part}</strong>
		<span>{data.piece.title}{data.piece.composer ? ` · ${data.piece.composer}` : ''}</span>
	</div>
	<button type="button" class="btn small ghost" onclick={() => (zoomed = !zoomed)} aria-pressed={zoomed}>{zoomed ? t.viewer.smaller : t.viewer.larger}</button>
</div>

<p class="clock {status}" role="status">
	<Icon name="clock" size={16} />
	{#if status === 'counting'}
		<span>{t.practice.viewer.counting} · {t.practice.viewer.today(t.practice.duration(today))}</span>
	{:else}
		<span>{t.practice.viewer[status]}</span>
	{/if}
</p>

<div class="pages" class:zoomed bind:this={box} bind:clientWidth={width}>
	{#if failed}
		<p class="msg error">{t.practice.viewer.failed}</p>
	{:else if !score}
		<p class="note">{t.viewer.loading}</p>
	{/if}
	{#each { length: pages }, i (i)}
		<canvas bind:this={canvases[i]} aria-label={t.viewer.page(i + 1, pages)}></canvas>
	{/each}
</div>

<p class="elsewhere"><a href={data.elsewhere} target="_blank" rel="noopener noreferrer"><Icon name="external" size={14} />{t.practice.viewer.elsewhere}</a></p>

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-4);
		margin-bottom: var(--space-3);
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--accent);
		font-weight: 600;
	}

	.what {
		display: grid;
		flex: 1;
		min-width: 0;
	}

	.what strong {
		font-size: 1.125rem;
	}

	.what span {
		overflow: hidden;
		color: var(--text-muted);
		font-size: 0.875rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.clock {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0 0 var(--space-4);
		padding: var(--space-1) var(--space-3);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.clock.idle,
	.clock.full,
	.clock.stopped {
		background: color-mix(in oklab, var(--text-muted) 14%, transparent);
		color: var(--text-muted);
	}

	.pages {
		display: grid;
		gap: var(--space-3);
		overflow-x: auto;
	}

	canvas {
		display: block;
		max-width: none;
		border: 1px solid var(--hairline);
		border-radius: 4px;
		background: #fff;
	}

	.note {
		color: var(--text-muted);
	}

	.elsewhere {
		margin-top: var(--space-4);
		font-size: 0.875rem;
	}

	.elsewhere a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--text-muted);
	}
</style>
