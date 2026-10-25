<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Metronome from '#lib/components/Metronome.svelte';
	import PracticeScore from '#lib/components/PracticeScore.svelte';
	import Title from '#lib/components/Title.svelte';
	import Tuner from '#lib/components/Tuner.svelte';
	import { BEAT_SECONDS, PracticeClock } from '#lib/practice/practice.ts';

	/**
	 * The practice viewer: the part page by page (PracticeScore), with the piece's recording,
	 * a metronome and a tuner. With practice time on, a clock counts the time the part is open,
	 * visible and in use (see PracticeClock); every 30 seconds, and when the page is hidden or
	 * left, the counted seconds go to /api/ueben.
	 */
	let { data } = $props();

	/** The tools, each a button in the score's toolbar; PracticeScore places their panel beside the page. */
	let playing = $state(false);
	const tools = $derived([
		...(data.recording ? [{ value: 'recording' as const, label: t.practice.recording.title }] : []),
		{ value: 'metronome', label: t.practice.metronome.title },
		{ value: 'tuner', label: t.practice.tuner.title }
	]);

	// The clock: ticks every 5 seconds, reports every 30; only with practice time on.
	type Status = 'counting' | 'idle' | 'full' | 'stopped';
	let status = $state<Status>('counting');
	let today = $state(0);
	$effect(() => {
		today = data.todaySeconds;
		if (!data.counting) return;
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

	// The screen stays on while the part is open, where the browser allows it.
	$effect(() => {
		type Lock = { release: () => Promise<void> };
		const wake = (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<Lock> } }).wakeLock;
		if (!wake) return;
		let lock: Lock | null = null;
		const take = () => {
			if (document.visibilityState === 'visible') wake.request('screen').then((next) => (lock = next), () => {});
		};
		take();
		document.addEventListener('visibilitychange', take);
		return () => {
			document.removeEventListener('visibilitychange', take);
			lock?.release().catch(() => {});
		};
	});
</script>

<Title title={t.practice.viewer.title(data.part, data.piece.title)} />

<div class="head">
	<a class="back" href="/meine-noten"><Icon name="back" size={16} />{t.practice.viewer.back}</a>
	<div class="what">
		<strong>{data.part}</strong>
		<span>{data.piece.title}{data.piece.composer ? ` · ${data.piece.composer}` : ''}</span>
	</div>
	{#if data.counting}
		<p class="clock {status}" role="status">
			<Icon name="clock" size={16} />
			{#if status === 'counting'}
				<span>{t.practice.viewer.counting} · {t.practice.viewer.today(t.practice.duration(today))}</span>
			{:else}
				<span>{t.practice.viewer[status]}</span>
			{/if}
		</p>
	{:else}
		<p class="clock off"><Icon name="clock" size={16} /><span>{t.practice.viewer.notCounting} <a href="/profil#probenzeit">{t.practice.viewer.turnOn}</a></span></p>
	{/if}
</div>

{#snippet toolPanel(tool: string)}
	{#if tool === 'recording' && data.recording}
		<section class="recording" aria-label={t.practice.recording.title}>
			{#if data.recording.youtube && playing}
				<div class="video">
					<iframe
						src="https://www.youtube-nocookie.com/embed/{data.recording.youtube}?autoplay=1&rel=0"
						title={t.practice.recording.title}
						allow="autoplay; encrypted-media; picture-in-picture"
						allowfullscreen
					></iframe>
				</div>
			{:else if data.recording.youtube}
				<button type="button" class="btn" onclick={() => (playing = true)}><Icon name="music" size={16} />{t.practice.recording.play}</button>
				<p class="muted">{t.practice.recording.hint}</p>
			{/if}
			<a class="external" href={data.recording.url} target="_blank" rel="noopener noreferrer nofollow"><Icon name="external" size={14} />{t.practice.recording.open}</a>
		</section>
	{:else if tool === 'metronome'}
		<Metronome />
	{:else if tool === 'tuner'}
		<Tuner />
	{/if}
{/snippet}

<PracticeScore file={data.file} marks={data.marks} {tools} panel={toolPanel} />

<p class="elsewhere"><a href={data.elsewhere} target="_blank" rel="noopener noreferrer"><Icon name="external" size={14} />{t.practice.viewer.elsewhere}</a></p>

<style>
	.head {
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
		margin: 0;
		padding: var(--space-1) var(--space-3);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.clock.idle,
	.clock.full,
	.clock.stopped,
	.clock.off {
		background: color-mix(in oklab, var(--text-muted) 14%, transparent);
		color: var(--text-muted);
	}

	.clock.off {
		font-weight: 400;
	}

	.clock a {
		color: var(--accent);
		font-weight: 600;
	}

	.recording {
		display: grid;
		gap: var(--space-2);
		padding-right: var(--space-5);
	}

	.video {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: var(--radius-s);
		background: #000;
	}

	.video iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}

	.muted {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.external,
	.elsewhere a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.elsewhere {
		margin-top: var(--space-3);
	}
</style>
