import { describe, expect, it } from 'vitest';
import { clampBpm, detectPitch, nearestNote, tapTempo } from './audio.ts';

const RATE = 24_000;
/** A tone with a few overtones, as instruments have, and a little noise. */
function tone(frequency: number, length = 2048, overtones = [1, 0.5, 0.3]) {
	const samples = new Float32Array(length);
	let seed = 1;
	for (let i = 0; i < length; i++) {
		seed = (seed * 16807) % 2147483647;
		const noise = (seed / 2147483647 - 0.5) * 0.02;
		samples[i] = overtones.reduce((sum, level, k) => sum + level * 0.3 * Math.sin((2 * Math.PI * frequency * (k + 1) * i) / RATE), 0) + noise;
	}
	return samples;
}

describe('detectPitch', () => {
	it('finds the fundamental across the orchestra’s range', () => {
		for (const frequency of [41.2, 65.4, 196, 261.6, 440, 442, 880, 1760]) {
			const found = detectPitch(tone(frequency), RATE);
			expect(found, String(frequency)).not.toBeNull();
			// Within 3 cents.
			expect(Math.abs(1200 * Math.log2(found! / frequency)), String(frequency)).toBeLessThan(3);
		}
	});

	it('is not fooled by a strong overtone', () => {
		const found = detectPitch(tone(220, 2048, [0.6, 1, 0.4]), RATE)!;
		expect(Math.abs(1200 * Math.log2(found / 220))).toBeLessThan(3);
	});

	it('says nothing for silence or noise', () => {
		expect(detectPitch(new Float32Array(2048), RATE)).toBeNull();
		const noise = new Float32Array(2048).map((_, i) => Math.sin(i * 12.9898) * 43758.5453 % 1 * 0.5);
		expect(detectPitch(noise, RATE)).toBeNull();
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
