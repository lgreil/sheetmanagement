<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import { clampBpm, clicksOf, isCompound, MAX_BPM, meterById, METERS, MIN_BPM, tapTempo, tempoName, TEMPI, type Accent } from '#lib/practice/audio.ts';
	import MetronomeDevice from './MetronomeDevice.svelte';

	/**
	 * A metronome with Web Audio: clicks are scheduled a little ahead on the audio clock, so they
	 * stay even when the page is busy. Tempo by number, marking (Andante …) or tapping; a time
	 * signature stresses the bar's first beat and where it falls in two. Remembered in this browser.
	 */

	/** In full screen's small panel: menus instead of rows of buttons. */
	let { compact = false }: { compact?: boolean } = $props();

	const KEY = 'metronome';
	function remembered(): { bpm: number; meter: string; dotted: boolean } {
		try {
			const value = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { bpm?: number; meter?: string; dotted?: boolean };
			return { bpm: clampBpm(value.bpm ?? 92), meter: meterById(value.meter ?? '4/4').id, dotted: !!value.dotted };
		} catch {
			return { bpm: 92, meter: '4/4', dotted: false };
		}
	}

	const start = remembered();
	let bpm = $state(start.bpm);
	let meterId = $state(start.meter);
	let dotted = $state(start.dotted);
	let running = $state(false);
	let beat = $state(-1);
	/** The pendulum: headed left or right, or at rest. */
	let side = $state<-1 | 0 | 1>(0);
	let flash = $state(false);
	let taps: number[] = [];

	const meter = $derived(meterById(meterId));
	const clicks = $derived(clicksOf(meter, dotted));
	/** The note a click stands for, before the "=": ♩ = 92. */
	const UNIT = { quarter: '♩', eighth: '♪', half: '𝅗𝅥', dotted: '♩.' } as const;

	$effect(() => {
		const value = JSON.stringify({ bpm, meter: meterId, dotted });
		try {
			localStorage.setItem(KEY, value);
		} catch {
			// Not remembered, that's all.
		}
	});

	let context: AudioContext | null = null;
	let timer: ReturnType<typeof setInterval> | undefined;
	let next = 0;
	let count = 0;

	/** The bar's first beat high, the middle of the bar a little lower, the rest lower still. */
	const PITCH: Record<Accent, number> = { 2: 1760, 1: 1320, 0: 990 };
	const LOUD: Record<Accent, number> = { 2: 0.9, 1: 0.7, 0: 0.5 };

	function click(at: number, accent: Accent, index: number) {
		if (!context) return;
		const tone = context.createOscillator();
		const gain = context.createGain();
		tone.frequency.value = PITCH[accent];
		gain.gain.setValueAtTime(0.0001, at);
		gain.gain.exponentialRampToValueAtTime(LOUD[accent], at + 0.002);
		gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
		tone.connect(gain).connect(context.destination);
		tone.start(at);
		tone.stop(at + 0.06);
		setTimeout(
			() => {
				if (!running) return;
				beat = index;
				// Off to the other side, to arrive there with the next click.
				side = side === 1 ? -1 : 1;
				flash = accent === 2;
			},
			Math.max(0, (at - context.currentTime) * 1000)
		);
	}

	/** Every 25 ms: the clicks of the next 120 ms. */
	function schedule() {
		if (!context) return;
		while (next < context.currentTime + 0.12) {
			const accents = clicks.accents;
			const index = count % accents.length;
			click(next, accents[index], index);
			count++;
			next += 60 / bpm;
		}
	}

	function play() {
		// Made and resumed on the tap itself: phones only allow sound right after one.
		context ??= new AudioContext();
		context.resume().catch(() => {});
		next = context.currentTime + 0.05;
		count = 0;
		running = true;
		timer = setInterval(schedule, 25);
	}

	function stop() {
		clearInterval(timer);
		running = false;
		beat = -1;
		side = 0;
		flash = false;
	}

	$effect(() => () => {
		stop();
		context?.close().catch(() => {});
	});

	/** A new bar starts on its first beat. */
	function chooseMeter(id: string) {
		meterId = id;
		count = 0;
		beat = -1;
	}

	function tap() {
		const now = performance.now();
		taps = [...taps.filter((at) => now - at < 8000), now];
		const tempo = tapTempo(taps);
		if (tempo) bpm = tempo;
	}

	const step = (by: number) => (bpm = clampBpm(bpm + by));
</script>

<div class="metronome" class:compact class:running>
	<div class="top">
		<div class="device"><MetronomeDevice {bpm} {side} accent={flash} /></div>
		<div class="controls">
			<div class="reading">
				<label class="bpm">
					<span class="unit" aria-hidden="true">{UNIT[clicks.unit]} =</span>
					<input type="number" min={MIN_BPM} max={MAX_BPM} bind:value={bpm} onchange={() => (bpm = clampBpm(bpm || 92))} aria-label={t.practice.metronome.bpm} />
				</label>
				<strong class="name">{tempoName(bpm)}</strong>
			</div>
			<div class="steps">
				<button type="button" class="round" onclick={() => step(-1)} aria-label={t.practice.metronome.slower}>−</button>
				<button type="button" class="round" onclick={() => step(1)} aria-label={t.practice.metronome.faster}>+</button>
			</div>
			<div class="actions">
				<button type="button" class="btn ghost" onclick={tap} title={t.practice.metronome.tapHint}>{t.practice.metronome.tap}</button>
				<button type="button" class="btn go" onclick={() => (running ? stop() : play())} aria-pressed={running}>
					{running ? t.practice.metronome.stop : t.practice.metronome.start}
				</button>
			</div>
		</div>
	</div>
	<input class="slider" type="range" min={MIN_BPM} max={MAX_BPM} bind:value={bpm} aria-label={t.practice.metronome.bpm} />

	{#if compact}
		<div class="menus">
			<label class="field">
				{t.practice.metronome.tempo}
				<select value={tempoName(bpm)} onchange={(event) => (bpm = TEMPI.find((tempo) => tempo.name === event.currentTarget.value)?.typical ?? bpm)}>
					{#each TEMPI as tempo (tempo.name)}<option value={tempo.name}>{tempo.name}</option>{/each}
				</select>
			</label>
			<label class="field">
				{t.practice.metronome.meter}
				<select value={meterId} onchange={(event) => chooseMeter(event.currentTarget.value)}>
					{#each METERS as each (each.id)}<option value={each.id}>{each.id || t.practice.metronome.noMeter}</option>{/each}
				</select>
			</label>
		</div>
	{:else}
		<div class="chips" role="group" aria-label={t.practice.metronome.tempo}>
			{#each TEMPI as tempo (tempo.name)}
				<button type="button" class="chip" class:on={tempoName(bpm) === tempo.name} onclick={() => (bpm = tempo.typical)}>{tempo.name}</button>
			{/each}
		</div>

		<div class="chips" role="group" aria-label={t.practice.metronome.meter}>
			{#each METERS as each (each.id)}
				<button type="button" class="chip meter" class:on={meterId === each.id} aria-pressed={meterId === each.id} onclick={() => chooseMeter(each.id)}>
					{each.id || t.practice.metronome.noMeter}
				</button>
			{/each}
		</div>
	{/if}
	{#if isCompound(meter)}
		<div class="chips" role="group" aria-label={t.practice.metronome.count}>
			<button type="button" class="chip" class:on={!dotted} aria-pressed={!dotted} onclick={() => (dotted = false)}>♪ {t.practice.metronome.eighths}</button>
			<button type="button" class="chip" class:on={dotted} aria-pressed={dotted} onclick={() => (dotted = true)}>♩. {t.practice.metronome.dotted}</button>
		</div>
	{/if}

	<!-- The bar's beats, the current one lit; the first one bigger. -->
	<div class="beats" aria-hidden="true">
		{#each clicks.accents as accent, i (i)}
			<span class="beat a{accent}" class:on={beat === i}>{meter.id ? i + 1 : ''}</span>
		{/each}
	</div>
</div>

<style>
	.metronome {
		display: grid;
		gap: var(--space-3);
	}

	.top {
		display: grid;
		grid-template-columns: minmax(120px, 170px) 1fr;
		align-items: center;
		gap: var(--space-4);
	}

	.controls {
		display: grid;
		justify-items: center;
		gap: var(--space-3);
	}

	.reading {
		display: grid;
		justify-items: center;
	}

	.bpm {
		display: flex;
		align-items: baseline;
		gap: var(--space-1);
	}

	.unit {
		color: var(--text-muted);
		font-family: 'Noto Music', 'Segoe UI Symbol', 'Apple Symbols', var(--font);
		font-size: 1.5rem;
	}

	.bpm input {
		width: 3.2ch;
		border: 0;
		background: none;
		color: var(--text);
		font-family: var(--font-display);
		font-size: 3.25rem;
		font-weight: 600;
		line-height: 1;
		text-align: center;
		font-variant-numeric: tabular-nums;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.bpm input::-webkit-inner-spin-button {
		display: none;
	}

	/* The marking as printed on a score: italic, a little spaced. */
	.name {
		color: var(--accent);
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.25rem;
		font-style: italic;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.steps,
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-2);
	}

	.round {
		width: 44px;
		height: 44px;
		border: 1px solid var(--hairline);
		border-radius: 50%;
		background: var(--surface);
		box-shadow: var(--shadow);
		color: var(--text);
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
	}

	.round:active {
		transform: translateY(1px);
		box-shadow: none;
	}

	.go {
		min-width: 6.5em;
	}

	.running .go {
		background: var(--danger);
		border-color: var(--danger);
	}

	.slider {
		width: 100%;
		accent-color: var(--accent);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-1);
	}

	.chip {
		min-height: 32px;
		padding: 0 var(--space-2);
		border: 1px solid var(--hairline);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.chip.meter {
		min-width: 44px;
		font-variant-numeric: tabular-nums;
	}

	.chip.on {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
	}

	/* The bar's beats as little lamps. */
	.beats {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-height: 32px;
	}

	.beat {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: color-mix(in oklab, var(--text) 10%, transparent);
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		transition:
			background 0.06s,
			box-shadow 0.06s;
	}

	.beat.a2 {
		width: 32px;
		height: 32px;
		font-size: 0.875rem;
	}

	.beat.a1 {
		width: 28px;
		height: 28px;
	}

	.beat.on {
		background: var(--accent);
		box-shadow: 0 0 0 4px color-mix(in oklab, var(--accent) 25%, transparent);
		color: var(--accent-contrast);
	}

	.menus {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
	}

	.compact {
		gap: var(--space-2);
	}

	.compact .top {
		grid-template-columns: 96px 1fr;
		gap: var(--space-3);
	}

	.compact .controls {
		gap: var(--space-2);
	}

	.compact .round {
		width: 38px;
		height: 38px;
	}

	.compact .bpm input {
		font-size: 2.5rem;
	}

	.compact .name {
		font-size: 1.0625rem;
	}

	@media (max-width: 380px) {
		.top {
			grid-template-columns: 110px 1fr;
			gap: var(--space-3);
		}
	}
</style>
