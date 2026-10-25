<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import { detectPitch, DRONE_HARMONICS, noteFrequency, PitchSmoother } from '#lib/practice/audio.ts';

	/**
	 * A tuner and a drone. The tuner reads the microphone about twelve times a second and shows
	 * the nearest note and how far off it is, with some inertia; in a pause it keeps the last
	 * reading. Nothing is recorded or sent anywhere, and the microphone is on only while it's
	 * started. The drone holds a note with overtones, at the same concert A. The concert A and
	 * the drone's note are remembered in this browser (orchestras often tune to 442 or 443 Hz).
	 */
	let { compact = false }: { compact?: boolean } = $props();

	const KEY = 'tuner';
	function remembered(): { a4: number; pitchClass: number; octave: number; fifth: boolean; volume: number } {
		const fallback = { a4: 440, pitchClass: 9, octave: 3, fifth: false, volume: 0.6 };
		try {
			const value = { ...fallback, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
			return {
				a4: value.a4 >= 415 && value.a4 <= 466 ? value.a4 : 440,
				pitchClass: Number.isInteger(value.pitchClass) && value.pitchClass >= 0 && value.pitchClass < 12 ? value.pitchClass : 9,
				octave: Number.isInteger(value.octave) && value.octave >= 1 && value.octave <= 5 ? value.octave : 3,
				fifth: !!value.fifth,
				volume: value.volume >= 0 && value.volume <= 1 ? value.volume : 0.6
			};
		} catch {
			return fallback;
		}
	}

	const start = remembered();
	let a4 = $state(start.a4);
	$effect(() => {
		const value = JSON.stringify({ a4, pitchClass, octave, fifth, volume });
		try {
			localStorage.setItem(KEY, value);
		} catch {
			// Not remembered, that's all.
		}
	});

	// The tuner.
	let running = $state(false);
	let problem = $state<string | null>(null);
	/** The audio didn't start: one more tap starts it. */
	let suspended = $state(false);
	const smoother = new PitchSmoother();
	/** Bumped on each reading, so the note is worked out again. */
	let readings = $state(0);
	let lastHeard = $state(0);
	let now = $state(0);
	const note = $derived.by(() => {
		void readings;
		return smoother.note(a4);
	});
	/** No tone for a moment: the last reading stays, paler. */
	const stale = $derived(!!note && now - lastHeard > 700);

	let stream: MediaStream | null = null;
	let context: AudioContext | null = null;
	let timer: ReturnType<typeof setInterval> | undefined;
	const wakeAudio = () => context?.resume().catch(() => {});

	async function listen() {
		problem = null;
		// The microphone only over https (or on localhost): on the phone through http://192.168… there is none.
		if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
			problem = t.practice.tuner.insecure;
			return;
		}
		// Made and started on the tap itself: phones keep audio silent unless it starts right on
		// a tap, and asking for the microphone takes longer than that.
		context = new AudioContext();
		const resumed = context.resume().catch(() => {});
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
		} catch {
			problem = t.practice.tuner.noMic;
			context.close().catch(() => {});
			context = null;
			return;
		}
		await resumed;
		const analyser = context.createAnalyser();
		analyser.fftSize = 4096;
		context.createMediaStreamSource(stream).connect(analyser);
		// Safari only runs a graph that ends in the speakers: through a gain of 0, so nothing is heard.
		const mute = context.createGain();
		mute.gain.value = 0;
		analyser.connect(mute).connect(context.destination);
		const buffer = new Float32Array(analyser.fftSize);
		// Every second sample at 44.1 or 48 kHz: enough for the highest notes, a quarter of the work.
		const step = context.sampleRate > 30_000 ? 2 : 1;
		const samples = new Float32Array(buffer.length / step);
		const rate = context.sampleRate / step;
		smoother.reset();
		readings++;
		running = true;
		timer = setInterval(() => {
			now = performance.now();
			// Still not running (a phone that wanted another tap, or back from the background).
			suspended = context?.state !== 'running';
			if (suspended) return;
			analyser.getFloatTimeDomainData(buffer);
			for (let i = 0; i < samples.length; i++) samples[i] = buffer[i * step];
			const frequency = detectPitch(samples, rate);
			if (!frequency) return;
			smoother.push(frequency);
			lastHeard = now;
			readings++;
		}, 80);
	}

	function stopListening() {
		clearInterval(timer);
		stream?.getTracks().forEach((track) => track.stop());
		context?.close().catch(() => {});
		stream = null;
		context = null;
		running = false;
	}

	const verdict = $derived(!note ? null : Math.abs(note.cents) <= 5 ? 'ok' : note.cents < 0 ? 'low' : 'high');
	const hertz = (hz: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(hz);

	// The drone.
	let pitchClass = $state(start.pitchClass);
	let octave = $state(start.octave);
	let fifth = $state(start.fifth);
	let volume = $state(start.volume);
	let droning = $state(false);
	let drone: { context: AudioContext; master: GainNode; voices: { oscillators: OscillatorNode[]; ratio: number }[] } | null = null;
	const droneFrequency = $derived(noteFrequency(pitchClass, octave, a4));

	/** Two slightly detuned voices per note make it breathe; the fifth is a pure one (3:2). */
	function droneVoice(target: NonNullable<typeof drone>, wave: PeriodicWave, ratio: number, level: number, into: AudioNode) {
		const gain = target.context.createGain();
		gain.gain.value = level;
		gain.connect(into);
		const oscillators = [-4, 4].map((detune) => {
			const oscillator = target.context.createOscillator();
			oscillator.setPeriodicWave(wave);
			oscillator.frequency.value = droneFrequency * ratio;
			oscillator.detune.value = detune;
			oscillator.connect(gain);
			oscillator.start();
			return oscillator;
		});
		return { oscillators, ratio };
	}

	function startDrone() {
		const audio = new AudioContext();
		audio.resume().catch(() => {});
		const master = audio.createGain();
		master.gain.value = 0;
		// Soft at the top, like a string heard from a little way off.
		const filter = audio.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 3200;
		filter.Q.value = 0.4;
		master.connect(filter).connect(audio.destination);
		// A slow swell, so it doesn't sound like a machine.
		const swell = audio.createOscillator();
		const depth = audio.createGain();
		swell.frequency.value = 0.18;
		depth.gain.value = 0.035;
		swell.connect(depth).connect(master.gain);
		swell.start();
		const wave = audio.createPeriodicWave(new Float32Array(DRONE_HARMONICS.length + 1), new Float32Array([0, ...DRONE_HARMONICS]));
		drone = { context: audio, master, voices: [] };
		drone.voices.push(droneVoice(drone, wave, 1, 0.5, master));
		if (fifth) drone.voices.push(droneVoice(drone, wave, 1.5, 0.32, master));
		master.gain.setTargetAtTime(volume * 0.3, audio.currentTime, 0.25);
		droning = true;
	}

	function stopDrone() {
		const ending = drone;
		drone = null;
		droning = false;
		if (!ending) return;
		ending.master.gain.setTargetAtTime(0, ending.context.currentTime, 0.2);
		setTimeout(() => ending.context.close().catch(() => {}), 1200);
	}

	// A new note or concert A glides there; the fifth or the volume change at once.
	$effect(() => {
		const frequency = droneFrequency;
		if (!drone) return;
		for (const voice of drone.voices) for (const oscillator of voice.oscillators) oscillator.frequency.setTargetAtTime(frequency * voice.ratio, drone.context.currentTime, 0.06);
	});
	$effect(() => {
		const level = volume;
		drone?.master.gain.setTargetAtTime(level * 0.3, drone.context.currentTime, 0.08);
	});
	$effect(() => {
		const withFifth = fifth;
		if (!drone || withFifth === drone.voices.length > 1) return;
		stopDrone();
		startDrone();
	});

	/** The drone on the note the tuner heard last. */
	function droneHeard() {
		if (!note) return;
		pitchClass = note.pitchClass;
		octave = Math.min(5, Math.max(1, note.octave));
	}

	$effect(() => () => {
		stopListening();
		stopDrone();
	});
</script>

<div class="tuner" class:compact>
	<!-- Always there: a dash before the first note, the last one held in a pause. -->
	<div class="reading" class:ok={verdict === 'ok' && !stale} class:stale class:idle={!note} role="status">
		<strong class="name">
			{#if note}{t.practice.tuner.notes[note.pitchClass]}<sub>{note.octave}</sub>{:else}–{/if}
		</strong>
		<div class="meter" aria-hidden="true">
			<span class="zero"></span>
			<span class="needle" style:left="{50 + (note?.cents ?? 0)}%"></span>
		</div>
		<span class="detail">
			{#if note}
				{t.practice.tuner.cents(note.cents)} · {verdict === 'ok' ? t.practice.tuner.inTune : verdict === 'low' ? t.practice.tuner.low : t.practice.tuner.high} · {hertz(note.frequency)} Hz{#if stale}{' '}· {t.practice.tuner.last}{/if}
			{:else if running && suspended}
				<button type="button" class="btn small" onclick={wakeAudio}>{t.practice.tuner.tapToListen}</button>
			{:else if running}
				{t.practice.tuner.listening}
			{:else}
				{t.practice.tuner.off}
			{/if}
		</span>
	</div>
	{#if problem}<p class="msg error">{problem}</p>{/if}

	<div class="row">
		<button type="button" class={running ? 'btn ghost' : 'btn'} onclick={() => (running ? stopListening() : listen())}>
			{running ? t.practice.tuner.stop : t.practice.tuner.start}
		</button>
		<label class="field a4">
			{t.practice.tuner.reference}
			<span>
				<input type="number" min="415" max="466" bind:value={a4} onchange={() => (a4 = Math.min(466, Math.max(415, Math.round(a4) || 440)))} />
				Hz
			</span>
		</label>
	</div>

	<section class="drone" aria-label={t.practice.drone.title}>
		<h3>{t.practice.drone.title}</h3>
		<div class="notes" role="group" aria-label={t.practice.drone.note}>
			{#each t.practice.tuner.notes as name, i (name)}
				<button type="button" class="key" class:black={[1, 3, 6, 8, 10].includes(i)} class:on={pitchClass === i} aria-pressed={pitchClass === i} onclick={() => (pitchClass = i)}>{name}</button>
			{/each}
		</div>
		<div class="row">
			<label class="field">
				{t.practice.drone.octave}
				<select bind:value={octave}>
					{#each [1, 2, 3, 4, 5] as each (each)}<option value={each}>{t.practice.tuner.notes[pitchClass]}{each}</option>{/each}
				</select>
			</label>
			<label class="check"><input type="checkbox" bind:checked={fifth} />{t.practice.drone.fifth}</label>
			<label class="field volume">
				{t.practice.drone.volume}
				<input type="range" min="0" max="1" step="0.05" bind:value={volume} />
			</label>
		</div>
		<div class="row">
			{#if note}<button type="button" class="btn ghost" onclick={droneHeard}>{t.practice.drone.heard}</button>{/if}
			<button type="button" class={droning ? 'btn secondary' : 'btn'} aria-pressed={droning} onclick={() => (droning ? stopDrone() : startDrone())}>
				{droning ? t.practice.drone.stop : t.practice.drone.play(`${t.practice.tuner.notes[pitchClass]}${octave}`)}
			</button>
		</div>
	</section>
</div>

<style>
	.tuner {
		display: grid;
		gap: var(--space-3);
	}

	.reading {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: var(--space-2);
		min-height: 130px;
		transition: opacity 0.4s var(--ease);
	}

	.reading.stale {
		opacity: 0.55;
	}

	.reading.idle .name,
	.reading.idle .needle {
		color: var(--text-muted);
		opacity: 0.5;
	}

	.name {
		font-family: var(--font-display);
		font-size: 3rem;
		line-height: 1;
		transition: color 0.3s var(--ease);
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

	/* Slow enough to read, quick enough to follow a bow. */
	.needle {
		position: absolute;
		top: -6px;
		width: 4px;
		height: 22px;
		margin-left: -2px;
		border-radius: 2px;
		background: var(--text);
		transition: left 0.35s cubic-bezier(0.25, 0.8, 0.3, 1);
	}

	.detail {
		min-height: 1.5em;
		color: var(--text-muted);
		font-size: 0.875rem;
		text-align: center;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: center;
		gap: var(--space-3);
	}

	.a4 span {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.a4 input {
		width: 5.5em;
	}

	.drone {
		display: grid;
		gap: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--hairline);
	}

	.drone h3 {
		margin: 0;
		font-size: 0.9375rem;
	}

	.notes {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 3px;
	}

	.key {
		min-width: 0;
		height: 40px;
		padding: 0;
		border: 1px solid var(--hairline);
		border-radius: 8px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.key.black {
		background: color-mix(in oklab, var(--text) 10%, var(--surface));
	}

	.key.on {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--accent-contrast);
		font-weight: 600;
	}

	.check {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: 40px;
		font-size: 0.875rem;
	}

	.volume input {
		width: 120px;
		accent-color: var(--accent);
	}

	/* In full screen's small panel. */
	.compact .reading {
		min-height: 96px;
		gap: var(--space-1);
	}

	.compact .name {
		font-size: 2.25rem;
	}

	.compact .drone {
		gap: var(--space-2);
		padding-top: var(--space-2);
	}

	.compact .key {
		height: 32px;
	}
</style>
