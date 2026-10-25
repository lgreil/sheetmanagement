import { describe, expect, it } from 'vitest';
import { clampBpm, clicksOf, detectPitch, isCompound, meterById, METERS, nearestNote, noteFrequency, PitchSmoother, tapTempo, tempoName, TEMPI } from './audio.ts';

const RATE = 24_000;
/** A tone with a few overtones, as instruments have, and some noise; `level` is its loudness. */
function tone(frequency: number, length = 2048, overtones = [1, 0.5, 0.3], level = 0.3, noiseLevel = 0.02) {
	const samples = new Float32Array(length);
	let seed = 1;
	for (let i = 0; i < length; i++) {
		seed = (seed * 16807) % 2147483647;
		const noise = (seed / 2147483647 - 0.5) * noiseLevel;
		samples[i] = overtones.reduce((sum, part, k) => sum + part * level * Math.sin((2 * Math.PI * frequency * (k + 1) * i) / RATE), 0) + noise;
	}
	return samples;
}
const cents = (found: number | null, frequency: number) => Math.abs(1200 * Math.log2(found! / frequency));

describe('detectPitch', () => {
	it('finds the fundamental across the orchestra’s range', () => {
		for (const frequency of [41.2, 65.4, 196, 261.6, 440, 442, 880, 1760]) {
			const found = detectPitch(tone(frequency), RATE);
			expect(found, String(frequency)).not.toBeNull();
			// Within 3 cents.
			expect(Math.abs(1200 * Math.log2(found! / frequency)), String(frequency)).toBeLessThan(3);
		}
	});

	it('hears a soft note from a phone’s microphone', () => {
		// About what a phone picks up without automatic gain, a metre from a violin.
		for (const frequency of [196, 440, 659]) expect(cents(detectPitch(tone(frequency, 2048, [1, 0.5, 0.3], 0.008, 0.002), RATE), frequency), String(frequency)).toBeLessThan(5);
	});

	it('hears a note in a noisy room', () => {
		expect(cents(detectPitch(tone(293.7, 2048, [1, 0.6, 0.4], 0.1, 0.12), RATE), 293.7)).toBeLessThan(10);
	});

	it('is not fooled by a strong overtone', () => {
		const found = detectPitch(tone(220, 2048, [0.6, 1, 0.4]), RATE)!;
		expect(Math.abs(1200 * Math.log2(found / 220))).toBeLessThan(3);
	});

	it('says nothing for silence or noise', () => {
		expect(detectPitch(new Float32Array(2048), RATE)).toBeNull();
		const noise = new Float32Array(2048).map((_, i) => Math.sin(i * 12.9898) * 43758.5453 % 1 * 0.5);
		expect(detectPitch(noise, RATE)).toBeNull();
		let seed = 7;
		const white = Float32Array.from({ length: 2048 }, () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647 - 0.5) * 0.2);
		expect(detectPitch(white, RATE)).toBeNull();
	});
});

describe('nearestNote', () => {
	it('names the note, its octave and how far off it is', () => {
		expect(nearestNote(440)).toEqual({ pitchClass: 9, octave: 4, cents: 0 });
		expect(nearestNote(261.63)).toEqual({ pitchClass: 0, octave: 4, cents: 0 });
		expect(nearestNote(41.2)).toMatchObject({ pitchClass: 4, octave: 1 });
		expect(nearestNote(446).cents).toBe(23);
		expect(nearestNote(435).cents).toBe(-20);
		// Tuned to 442 Hz, 442 is spot on.
		expect(nearestNote(442, 442)).toEqual({ pitchClass: 9, octave: 4, cents: 0 });
		// B flat below, B (German H) above.
		expect(nearestNote(466.16).pitchClass).toBe(10);
		expect(nearestNote(493.88)).toMatchObject({ pitchClass: 11, octave: 4 });
	});
});

describe('tempo', () => {
	it('takes the tempo from the taps', () => {
		expect(tapTempo([])).toBeNull();
		expect(tapTempo([1000])).toBeNull();
		expect(tapTempo([0, 500, 1000, 1500])).toBe(120);
		expect(tapTempo([0, 1000])).toBe(60);
		// A long pause starts again.
		expect(tapTempo([0, 500, 1000, 5000, 5750])).toBe(80);
	});

	it('stays between 30 and 240', () => {
		expect(clampBpm(10)).toBe(30);
		expect(clampBpm(300)).toBe(240);
		expect(clampBpm(92.4)).toBe(92);
		expect(tapTempo([0, 100])).toBe(240);
	});
});

describe('tempo markings', () => {
	it('names the tempo as a metronome’s scale does', () => {
		expect(tempoName(30)).toBe('Grave');
		expect(tempoName(52)).toBe('Largo');
		expect(tempoName(72)).toBe('Adagio');
		expect(tempoName(76)).toBe('Andante');
		expect(tempoName(107)).toBe('Andante');
		expect(tempoName(112)).toBe('Moderato');
		expect(tempoName(132)).toBe('Allegro');
		expect(tempoName(176)).toBe('Presto');
		expect(tempoName(240)).toBe('Prestissimo');
	});

	it('jumps to a tempo inside each marking’s own range', () => {
		for (const tempo of TEMPI) expect(tempoName(tempo.typical)).toBe(tempo.name);
	});
});

describe('time signatures', () => {
	it('stresses the first beat, and where the bar falls in two', () => {
		expect(meterById('3/4').accents).toEqual([2, 0, 0]);
		expect(meterById('4/4').accents).toEqual([2, 0, 1, 0]);
		expect(meterById('6/8').accents).toEqual([2, 0, 0, 1, 0, 0]);
		expect(meterById('2/2').unit).toBe('half');
		// Unknown ones are 4/4.
		expect(meterById('13/16').id).toBe('4/4');
		expect(METERS.every((meter) => meter.accents.length > 0)).toBe(true);
	});

	it('counts 6/8, 9/8 and 12/8 in dotted quarters on request', () => {
		expect(isCompound(meterById('6/8'))).toBe(true);
		expect(isCompound(meterById('3/8'))).toBe(false);
		expect(isCompound(meterById('7/8'))).toBe(false);
		expect(clicksOf(meterById('6/8'), true)).toEqual({ unit: 'dotted', accents: [2, 1] });
		expect(clicksOf(meterById('12/8'), true)).toEqual({ unit: 'dotted', accents: [2, 1, 1, 1] });
		expect(clicksOf(meterById('6/8'))).toEqual({ unit: 'eighth', accents: [2, 0, 0, 1, 0, 0] });
		// Only compound meters: 3/4 stays in quarters.
		expect(clicksOf(meterById('3/4'), true).unit).toBe('quarter');
	});
});

describe('PitchSmoother', () => {
	const hz = (cents: number, base = 440) => base * 2 ** (cents / 1200);

	it('calms a wobbling reading', () => {
		const smoother = new PitchSmoother();
		const readings = [0, 12, -10, 14, -12, 10, -8, 12];
		const shown: number[] = [];
		for (const cents of readings) {
			smoother.push(hz(cents));
			shown.push(smoother.note()!.cents);
		}
		const spread = (list: number[]) => Math.max(...list.slice(2)) - Math.min(...list.slice(2));
		expect(spread(shown)).toBeLessThan(spread(readings) / 2);
	});

	it('keeps the last reading through silence', () => {
		const smoother = new PitchSmoother();
		expect(smoother.note()).toBeNull();
		smoother.push(hz(-20));
		smoother.push(null);
		smoother.push(null);
		expect(smoother.note()).toMatchObject({ pitchClass: 9, cents: -20 });
	});

	it('goes to another note only when two readings agree', () => {
		const smoother = new PitchSmoother();
		smoother.push(440);
		// One stray octave is ignored.
		smoother.push(880);
		expect(smoother.note()).toMatchObject({ pitchClass: 9, octave: 4 });
		smoother.push(440);
		// A new note, played on.
		smoother.push(hz(200));
		smoother.push(hz(201));
		expect(smoother.note()).toMatchObject({ pitchClass: 11, octave: 4 });
	});

	it('holds the note’s name a little past the half-way line', () => {
		const smoother = new PitchSmoother(1);
		smoother.push(hz(40));
		expect(smoother.note()).toMatchObject({ pitchClass: 9, cents: 40 });
		smoother.push(hz(55));
		expect(smoother.note()).toMatchObject({ pitchClass: 9, cents: 55 });
		smoother.push(hz(65));
		smoother.push(hz(65));
		expect(smoother.note()).toMatchObject({ pitchClass: 10, cents: -35 });
	});

	it('follows the concert A', () => {
		const smoother = new PitchSmoother();
		smoother.push(442);
		expect(smoother.note(442)).toMatchObject({ pitchClass: 9, cents: 0 });
		smoother.reset();
		smoother.push(440);
		expect(smoother.note(442)!.cents).toBe(-8);
	});
});

describe('noteFrequency', () => {
	it('gives the frequency of a note at the concert A', () => {
		expect(noteFrequency(9, 4)).toBe(440);
		expect(noteFrequency(9, 3)).toBe(220);
		expect(noteFrequency(0, 4)).toBeCloseTo(261.63, 2);
		expect(noteFrequency(9, 4, 443)).toBe(443);
		expect(noteFrequency(7, 2, 442)).toBeCloseTo(98.44, 2);
	});
});
