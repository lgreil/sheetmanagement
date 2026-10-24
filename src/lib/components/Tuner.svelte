<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import { detectPitch, nearestNote, type Note } from '#lib/practice/audio.ts';

	/**
	 * A tuner: the microphone's pitch ten times a second, the nearest note and how far off it
	 * is. Nothing is recorded or sent anywhere; the microphone is on only while it's started.
	 * The concert A is remembered in this browser (orchestras often tune to 442 or 443 Hz).
	 */

	const KEY = 'tuner-a4';
	function rememberedA4(): number {
		try {
			const value = Number(localStorage.getItem(KEY));
			return value >= 415 && value <= 466 ? value : 440;
		} catch {
			return 440;
		}
	}

	let a4 = $state(rememberedA4());
	let running = $state(false);
	let problem = $state<string | null>(null);
	let note = $state<(Note & { frequency: number }) | null>(null);

	$effect(() => {
		const value = String(a4);
		try {
			localStorage.setItem(KEY, value);
		} catch {
			// Not remembered, that's all.
		}
	});

	let stream: MediaStream | null = null;
	let context: AudioContext | null = null;
	let timer: ReturnType<typeof setInterval> | undefined;
	/** The last few readings, so the needle doesn't jitter. */
	let recent: number[] = [];

	async function start() {
		problem = null;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
		} catch {
			problem = t.practice.tuner.noMic;
			return;
		}
		context = new AudioContext();
		await context.resume();
		const analyser = context.createAnalyser();
		analyser.fftSize = 4096;
		context.createMediaStreamSource(stream).connect(analyser);
		const buffer = new Float32Array(analyser.fftSize);
		// Every second sample at 44.1 or 48 kHz: enough for the highest notes, a quarter of the work.
		const step = context.sampleRate > 30_000 ? 2 : 1;
		const samples = new Float32Array(buffer.length / step);
		const rate = context.sampleRate / step;
		running = true;
		timer = setInterval(() => {
			analyser.getFloatTimeDomainData(buffer);
			for (let i = 0; i < samples.length; i++) samples[i] = buffer[i * step];
			const frequency = detectPitch(samples, rate);
			if (!frequency) {
				recent = [];
				note = null;
				return;
			}
			recent = [...recent, frequency].slice(-4);
			const sorted = [...recent].sort((a, b) => a - b);
			const steady = sorted[Math.floor(sorted.length / 2)];
			note = { ...nearestNote(steady, a4), frequency: steady };
		}, 100);
	}

	function stop() {
		clearInterval(timer);
		stream?.getTracks().forEach((track) => track.stop());
		context?.close().catch(() => {});
		stream = null;
		context = null;
		running = false;
		note = null;
	}

	$effect(() => () => stop());

	const verdict = $derived(!note ? null : Math.abs(note.cents) <= 5 ? 'ok' : note.cents < 0 ? 'low' : 'high');
	const frequency = (hz: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(hz);
</script>

<div class="tuner">
	{#if running}
		<div class="reading" class:ok={verdict === 'ok'} role="status">
			{#if note}
				<strong class="name">{t.practice.tuner.notes[note.pitchClass]}<sub>{note.octave}</sub></strong>
				<div class="meter" aria-hidden="true">
					<span class="zero"></span>
					<span class="needle" style:left="{50 + note.cents}%"></span>
				</div>
				<span class="detail">
					{t.practice.tuner.cents(note.cents)} · {verdict === 'ok' ? t.practice.tuner.inTune : verdict === 'low' ? t.practice.tuner.low : t.practice.tuner.high} · {frequency(note.frequency)} Hz
				</span>
			{:else}
				<span class="detail">{t.practice.tuner.listening}</span>
			{/if}
		</div>
	{/if}
	{#if problem}<p class="msg error">{problem}</p>{/if}

	<div class="row">
		<label class="field">
			{t.practice.tuner.reference}
			<span class="a4">
				<input type="number" min="415" max="466" bind:value={a4} onchange={() => (a4 = Math.min(466, Math.max(415, Math.round(a4) || 440)))} />
				Hz
			</span>
		</label>
		<button type="button" class={running ? 'btn ghost' : 'btn'} onclick={() => (running ? stop() : start())}>
			{running ? t.practice.tuner.stop : t.practice.tuner.start}
		</button>
	</div>
</div>

<style>
	.tuner {
		display: grid;
		gap: var(--space-3);
	}

	.reading {
		display: grid;
		justify-items: center;
		gap: var(--space-2);
		min-height: 120px;
		align-content: center;
	}

	.name {
		font-family: var(--font-display);
		font-size: 3rem;
		line-height: 1;
	}

	.name sub {
		margin-left: 2px;
		color: var(--text-muted);
		font-size: 1rem;
	}

	.reading.ok .name {
		color: var(--ok);
	}

	.meter {
		position: relative;
		width: min(100%, 320px);
		height: 10px;
		border-radius: 999px;
		background: linear-gradient(to right, color-mix(in oklab, var(--warn) 40%, transparent), color-mix(in oklab, var(--ok) 50%, transparent) 45% 55%, color-mix(in oklab, var(--warn) 40%, transparent));
	}

	.zero {
		position: absolute;
		top: -4px;
		bottom: -4px;
		left: 50%;
		width: 2px;
		background: var(--text-muted);
	}

	.needle {
		position: absolute;
		top: -6px;
		width: 4px;
		height: 22px;
		margin-left: -2px;
		border-radius: 2px;
		background: var(--text);
		transition: left 0.1s linear;
	}

	.detail {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: center;
		gap: var(--space-3);
	}

	.a4 {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.a4 input {
		width: 5.5em;
	}
</style>
