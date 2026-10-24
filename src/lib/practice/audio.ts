/**
 * The arithmetic behind the practice viewer's tuner and metronome, apart from Web Audio so it
 * can be tested: pitch from a stretch of microphone samples, the nearest note, tap tempo.
 */

export const MIN_BPM = 30;
export const MAX_BPM = 240;

export const clampBpm = (bpm: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));

/**
 * The tempo of the last few taps, from the gaps between them (milliseconds); null until there
 * are two. A pause of more than two seconds starts again.
 */
export function tapTempo(taps: number[]): number | null {
	const recent: number[] = [];
	for (let i = taps.length - 1; i >= 0 && recent.length < 6; i--) {
		if (recent.length && recent[0] - taps[i] > 2000) break;
		recent.unshift(taps[i]);
	}
	if (recent.length < 2) return null;
	const gap = (recent.at(-1)! - recent[0]) / (recent.length - 1);
	return clampBpm(60_000 / gap);
}

/** Lowest and highest pitch the tuner looks for: a double bass's low E (41 Hz) to a piccolo's top. */
const LOWEST = 38;
const HIGHEST = 4200;

/**
 * The fundamental of a stretch of samples in Hz, or null when it's too quiet or not a tone.
 * YIN's cumulative mean normalised difference: the first lag below a threshold, refined by
 * fitting a parabola through its neighbours.
 */
export function detectPitch(samples: Float32Array, sampleRate: number): number | null {
	let energy = 0;
	for (const sample of samples) energy += sample * sample;
	if (Math.sqrt(energy / samples.length) < 0.01) return null;

	const maxLag = Math.min(Math.floor(sampleRate / LOWEST), Math.floor(samples.length / 2));
	const minLag = Math.max(2, Math.floor(sampleRate / HIGHEST));
	const window = samples.length - maxLag;
	const diff = new Float32Array(maxLag + 1);
	for (let lag = 1; lag <= maxLag; lag++) {
		let sum = 0;
		for (let i = 0; i < window; i++) {
			const delta = samples[i] - samples[i + lag];
			sum += delta * delta;
		}
		diff[lag] = sum;
	}
	// Normalised: each lag against the mean of the ones before it.
	const norm = new Float32Array(maxLag + 1);
	norm[0] = 1;
	let running = 0;
	for (let lag = 1; lag <= maxLag; lag++) {
		running += diff[lag];
		norm[lag] = running ? (diff[lag] * lag) / running : 1;
	}
	let best = -1;
	for (let lag = minLag; lag <= maxLag; lag++) {
		if (norm[lag] < 0.15) {
			while (lag + 1 <= maxLag && norm[lag + 1] < norm[lag]) lag++;
			best = lag;
			break;
		}
	}
	if (best < 0) return null;
	const [a, b, c] = [norm[best - 1], norm[best], norm[best + 1] ?? norm[best]];
	const shift = a + c - 2 * b ? (a - c) / (2 * (a + c - 2 * b)) : 0;
	return sampleRate / (best + shift);
}

export interface Note {
	/** Index in the octave from C: 0 C … 9 A … 11 B (German H). */
	pitchClass: number;
	/** Scientific octave: A4 = 440 Hz. */
	octave: number;
	/** How far off the note, -50 to +50. */
	cents: number;
}

/** The nearest note to a frequency, with A4 at `a4` Hz. */
export function nearestNote(frequency: number, a4 = 440): Note {
	const semitones = 12 * Math.log2(frequency / a4);
	const nearest = Math.round(semitones);
	// MIDI numbering: A4 is 69, C4 is 60.
	const midi = 69 + nearest;
	return { pitchClass: ((midi % 12) + 12) % 12, octave: Math.floor(midi / 12) - 1, cents: Math.round((semitones - nearest) * 100) };
}
