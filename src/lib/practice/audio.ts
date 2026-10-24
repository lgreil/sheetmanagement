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
	// Phone microphones without automatic gain are quiet: a soft note a metre away is about 0.005.
	if (Math.sqrt(energy / samples.length) < 0.002) return null;

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
	// A noisy room: no lag that clear, but a clear enough lowest one is still the tone.
	if (best < 0) {
		let lowest = minLag;
		for (let lag = minLag; lag <= maxLag; lag++) if (norm[lag] < norm[lowest]) lowest = lag;
		// White noise stays near 0.9, a tone in a noisy room well under 0.2.
		if (norm[lowest] < 0.2) best = lowest;
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

/**
 * The tempo markings of a metronome's scale (as on a Wittner), with the tempo each one jumps
 * to; the name shown is the one whose range holds the beats per minute.
 */
export const TEMPI = [
	{ name: 'Grave', from: MIN_BPM, typical: 35 },
	{ name: 'Largo', from: 40, typical: 50 },
	{ name: 'Larghetto', from: 60, typical: 63 },
	{ name: 'Adagio', from: 66, typical: 70 },
	{ name: 'Andante', from: 76, typical: 92 },
	{ name: 'Moderato', from: 108, typical: 112 },
	{ name: 'Allegro', from: 120, typical: 138 },
	{ name: 'Presto', from: 168, typical: 184 },
	{ name: 'Prestissimo', from: 200, typical: 208 }
] as const;

export function tempoName(bpm: number): string {
	return TEMPI.findLast((tempo) => bpm >= tempo.from)?.name ?? TEMPI[0].name;
}

/** 2 the bar's first beat, 1 a beat the bar falls into (4/4's third), 0 the others. */
export type Accent = 0 | 1 | 2;

export interface Meter {
	/** "3/4"; "" for clicks without bars. */
	id: string;
	/** The note a click stands for: a quarter, an eighth, a half (alla breve). */
	unit: 'quarter' | 'eighth' | 'half';
	accents: Accent[];
}

export const METERS: Meter[] = [
	{ id: '2/4', unit: 'quarter', accents: [2, 0] },
	{ id: '3/4', unit: 'quarter', accents: [2, 0, 0] },
	{ id: '4/4', unit: 'quarter', accents: [2, 0, 1, 0] },
	{ id: '5/4', unit: 'quarter', accents: [2, 0, 0, 1, 0] },
	{ id: '2/2', unit: 'half', accents: [2, 0] },
	{ id: '3/8', unit: 'eighth', accents: [2, 0, 0] },
	{ id: '6/8', unit: 'eighth', accents: [2, 0, 0, 1, 0, 0] },
	{ id: '9/8', unit: 'eighth', accents: [2, 0, 0, 1, 0, 0, 1, 0, 0] },
	{ id: '12/8', unit: 'eighth', accents: [2, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0] },
	// 2 + 2 + 3, as in most Balkan dances.
	{ id: '7/8', unit: 'eighth', accents: [2, 0, 1, 0, 1, 0, 0] },
	{ id: '', unit: 'quarter', accents: [0] }
];

export const meterById = (id: string) => METERS.find((meter) => meter.id === id) ?? METERS[2];

/** 6/8, 9/8 and 12/8 are felt in dotted quarters: those can be the clicks instead of the eighths. */
export const isCompound = (meter: Meter) => meter.unit === 'eighth' && meter.accents.length % 3 === 0 && meter.accents.length > 3;

/** The clicks of one bar: every note of the meter, or for a compound one counted in dotted quarters, one per group of three. */
export function clicksOf(meter: Meter, dotted = false): { unit: Meter['unit'] | 'dotted'; accents: Accent[] } {
	if (!dotted || !isCompound(meter)) return { unit: meter.unit, accents: meter.accents };
	return { unit: 'dotted', accents: meter.accents.filter((_, i) => i % 3 === 0).map((accent, i) => (i === 0 ? 2 : accent ? 1 : 0)) };
}
