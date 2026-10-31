import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import { qrModules, qrPath } from './qr.ts';
import { randomCode } from './tickets.ts';

/** The modules as a grey image, 4 pixels per module with a quiet zone, for the reader. */
function image(modules: boolean[][]) {
	const scale = 4;
	const quiet = 4;
	const size = (modules.length + quiet * 2) * scale;
	const data = new Uint8ClampedArray(size * size * 4).fill(255);
	modules.forEach((row, y) =>
		row.forEach((dark, x) => {
			if (!dark) return;
			for (let dy = 0; dy < scale; dy++)
				for (let dx = 0; dx < scale; dx++) {
					const i = (((y + quiet) * scale + dy) * size + (x + quiet) * scale + dx) * 4;
					data[i] = data[i + 1] = data[i + 2] = 0;
				}
		})
	);
	return { data, width: size, height: size, colorSpace: 'srgb' } as ImageData;
}

/** Decoded by ZXing, the reader the door's phones use where the browser has none. */
async function decode(text: string) {
	const [result] = await readBarcodes(image(qrModules(text)), { formats: ['QRCode'], tryHarder: true });
	return result;
}

beforeAll(async () => {
	const binary = readFileSync(new URL('../../../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm', import.meta.url));
	await prepareZXingModule({ overrides: { wasmBinary: binary.buffer as ArrayBuffer }, fireImmediately: true });
});

describe('qrModules', () => {
	it('makes a ticket code a version 2 code that reads back', async () => {
		const code = randomCode();
		expect(qrModules(code)).toHaveLength(25);
		const result = await decode(code);
		expect(result?.text).toBe(code);
		expect(result?.ecLevel).toBe('M');
	});

	it('reads back at every version it makes, the larger ones with version information', async () => {
		for (const length of [1, 14, 40, 60, 100, 130, 180, 213]) {
			const text = 'https://noten.example/karte/'.repeat(10).slice(0, length);
			const result = await decode(text);
			expect(result?.text, `${length} bytes`).toBe(text);
		}
	});

	it('keeps letters beyond ASCII', async () => {
		expect((await decode('Grüße aus Bergkamen ♫'))?.text).toBe('Grüße aus Bergkamen ♫');
	});

	it('refuses what doesn’t fit', () => {
		expect(() => qrModules('x'.repeat(300))).toThrow();
	});
});

describe('qrPath', () => {
	it('draws runs of dark modules inside the quiet zone', () => {
		const { path, size } = qrPath('ABC');
		expect(size).toBe(21 + 8);
		// The top left finder starts with a run of seven.
		expect(path.startsWith('M4 4h7v1h-7z')).toBe(true);
	});
});
