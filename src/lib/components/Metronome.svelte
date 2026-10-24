<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import { clampBpm, MAX_BPM, MIN_BPM, tapTempo } from '#lib/practice/audio.ts';

	/**
	 * A metronome with Web Audio: clicks are scheduled a little ahead on the audio clock, so
	 * they stay even when the page is busy. The tempo and accent are remembered in this browser.
	 */

	const KEY = 'metronome';
	function remembered(): { bpm: number; beats: number } {
		try {
			const value = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { bpm?: number; beats?: number };
			return { bpm: clampBpm(value.bpm ?? 80), beats: [1, 2, 3, 4, 6].includes(value.beats ?? 0) ? value.beats! : 4 };
		} catch {
			return { bpm: 80, beats: 4 };
		}
	}

	const start = remembered();
	let bpm = $state(start.bpm);
	let beats = $state(start.beats);
	let running = $state(false);
	let beat = $state(-1);
	let taps: number[] = [];

	$effect(() => {
		const value = JSON.stringify({ bpm, beats });
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

	function click(at: number, accent: boolean, index: number) {
		if (!context) return;
		const tone = context.createOscillator();
		const gain = context.createGain();
		tone.frequency.value = accent ? 1600 : 1000;
		gain.gain.setValueAtTime(0.0001, at);
		gain.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.55, at + 0.002);
		gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
		tone.connect(gain).connect(context.destination);
		tone.start(at);
		tone.stop(at + 0.06);
		setTimeout(() => running && (beat = index), Math.max(0, (at - context.currentTime) * 1000));
	}

	/** Every 25 ms: the clicks of the next 120 ms. */
	function schedule() {
		if (!context) return;
		while (next < context.currentTime + 0.12) {
			const index = count % beats;
			click(next, beats > 1 && index === 0, index);
			count++;
			next += 60 / bpm;
		}
	}

	async function play() {
		// Made and resumed on the tap: phones only allow sound after one.
		context ??= new AudioContext();
		await context.resume();
		next = context.currentTime + 0.05;
		count = 0;
		running = true;
		timer = setInterval(schedule, 25);
	}

	function stop() {
		clearInterval(timer);
		running = false;
		beat = -1;
	}

	$effect(() => () => {
		stop();
		context?.close().catch(() => {});
	});

	function tap() {
		const now = performance.now();
		taps = [...taps.filter((at) => now - at < 8000), now];
		const tempo = tapTempo(taps);
		if (tempo) bpm = tempo;
	}

	const step = (by: number) => (bpm = clampBpm(bpm + by));
</script>

<div class="metronome">
	<div class="tempo">
		<button type="button" class="round" onclick={() => step(-1)} aria-label={t.practice.metronome.slower}>−</button>
		<label class="bpm">
			<input type="number" min={MIN_BPM} max={MAX_BPM} bind:value={bpm} onchange={() => (bpm = clampBpm(bpm || 80))} aria-label={t.practice.metronome.bpm} />
			<small>{t.practice.metronome.bpm}</small>
		</label>
		<button type="button" class="round" onclick={() => step(1)} aria-label={t.practice.metronome.faster}>+</button>
	</div>
	<input class="slider" type="range" min={MIN_BPM} max={MAX_BPM} bind:value={bpm} aria-label={t.practice.metronome.bpm} />

	<div class="beats" aria-hidden="true">
		{#each { length: beats }, i (i)}
			<span class="beat" class:on={beat === i} class:accent={beats > 1 && i === 0}></span>
		{/each}
	</div>

	<div class="row">
		<label class="field">
			{t.practice.metronome.beats}
			<select bind:value={beats}>
				{#each [1, 2, 3, 4, 6] as each (each)}<option value={each}>{t.practice.metronome.beatsOf(each)}</option>{/each}
			</select>
		</label>
		<button type="button" class="btn ghost" onclick={tap} title={t.practice.metronome.tapHint}>{t.practice.metronome.tap}</button>
		<button type="button" class="btn" onclick={() => (running ? stop() : play())} aria-pressed={running}>
			{running ? t.practice.metronome.stop : t.practice.metronome.start}
		</button>
	</div>
</div>

<style>
	.metronome {
		display: grid;
		gap: var(--space-3);
	}

	.tempo {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
	}

	.round {
		width: 44px;
		height: 44px;
		border: 1px solid var(--hairline);
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
	}

	.bpm {
		display: grid;
		justify-items: center;
	}

	.bpm input {
		width: 4.2ch;
		border: 0;
		background: none;
		color: var(--text);
		font-family: var(--font-display);
		font-size: 2.75rem;
		font-weight: 600;
		text-align: center;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.bpm input::-webkit-inner-spin-button {
		display: none;
	}

	.bpm small {
		color: var(--text-muted);
		font-size: 0.75rem;
	}

	.slider {
		width: 100%;
		accent-color: var(--accent);
	}

	.beats {
		display: flex;
		justify-content: center;
		gap: var(--space-2);
	}

	.beat {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--hairline);
		transition: background 0.05s;
	}

	.beat.accent {
		width: 18px;
		height: 18px;
	}

	.beat.on {
		background: var(--accent);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: center;
		gap: var(--space-2);
	}
</style>
