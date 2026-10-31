/**
 * QR codes for tickets (docs/tickets-plan.md), without a library: byte mode, error correction
 * level M, versions 1 to 10, which is plenty for a 26-letter ticket code (version 2). Follows
 * ISO/IEC 18004; the structure is Project Nayuki's well-known reference implementation, cut
 * down to what tickets need.
 */

/** Error correction codewords per block and number of blocks at level M, by version (index 0 unused). */
const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const MAX_VERSION = 10;

/** Modules that carry data or error correction, in bits. */
function rawDataModules(version: number): number {
	let result = (16 * version + 128) * version + 64;
	if (version >= 2) {
		const align = Math.floor(version / 7) + 2;
		result -= (25 * align - 10) * align - 55;
		if (version >= 7) result -= 36;
	}
	return result;
}

const dataCodewords = (version: number) => Math.floor(rawDataModules(version) / 8) - ECC_PER_BLOCK[version] * BLOCKS[version];

/** Multiplication in GF(2^8) with the QR code's polynomial. */
function multiply(x: number, y: number): number {
	let z = 0;
	for (let i = 7; i >= 0; i--) {
		z = (z << 1) ^ ((z >>> 7) * 0x11d);
		z ^= ((y >>> i) & 1) * x;
	}
	return z;
}

function rsDivisor(degree: number): number[] {
	const result = new Array<number>(degree).fill(0);
	result[degree - 1] = 1;
	let root = 1;
	for (let i = 0; i < degree; i++) {
		for (let j = 0; j < result.length; j++) {
			result[j] = multiply(result[j], root);
			if (j + 1 < result.length) result[j] ^= result[j + 1];
		}
		root = multiply(root, 0x02);
	}
	return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
	const result = new Array<number>(divisor.length).fill(0);
	for (const byte of data) {
		const factor = byte ^ result.shift()!;
		result.push(0);
		divisor.forEach((coefficient, i) => (result[i] ^= multiply(coefficient, factor)));
	}
	return result;
}

/** The data codewords split into blocks, each with its error correction, interleaved. */
function withErrorCorrection(data: number[], version: number): number[] {
	const blocks = BLOCKS[version];
	const eccLength = ECC_PER_BLOCK[version];
	const raw = Math.floor(rawDataModules(version) / 8);
	const shortBlocks = blocks - (raw % blocks);
	const shortLength = Math.floor(raw / blocks);
	const divisor = rsDivisor(eccLength);
	const all: number[][] = [];
	for (let i = 0, k = 0; i < blocks; i++) {
		const block = data.slice(k, k + shortLength - eccLength + (i < shortBlocks ? 0 : 1));
		k += block.length;
		const ecc = rsRemainder(block, divisor);
		if (i < shortBlocks) block.push(0);
		all.push([...block, ...ecc]);
	}
	const result: number[] = [];
	for (let i = 0; i < all[0].length; i++) {
		all.forEach((block, j) => {
			// The placeholder byte of the short blocks isn't sent.
			if (i !== shortLength - eccLength || j >= shortBlocks) result.push(block[i]);
		});
	}
	return result;
}

function alignmentPositions(version: number): number[] {
	if (version === 1) return [];
	const count = Math.floor(version / 7) + 2;
	const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
	const result = [6];
	for (let position = version * 4 + 10; result.length < count; position -= step) result.splice(1, 0, position);
	return result;
}

const MASKS: ((x: number, y: number) => boolean)[] = [
	(x, y) => (x + y) % 2 === 0,
	(_, y) => y % 2 === 0,
	(x) => x % 3 === 0,
	(x, y) => (x + y) % 3 === 0,
	(x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
	(x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
	(x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
	(x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
];

class Grid {
	readonly size: number;
	readonly dark: boolean[][];
	readonly fixed: boolean[][];

	constructor(readonly version: number) {
		this.size = version * 4 + 17;
		this.dark = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
		this.fixed = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
	}

	set(x: number, y: number, dark: boolean) {
		this.dark[y][x] = dark;
		this.fixed[y][x] = true;
	}

	drawPatterns() {
		const { size } = this;
		for (let i = 0; i < size; i++) {
			this.set(6, i, i % 2 === 0);
			this.set(i, 6, i % 2 === 0);
		}
		for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
			for (let dy = -4; dy <= 4; dy++)
				for (let dx = -4; dx <= 4; dx++) {
					const x = cx + dx;
					const y = cy + dy;
					const ring = Math.max(Math.abs(dx), Math.abs(dy));
					if (x >= 0 && x < size && y >= 0 && y < size) this.set(x, y, ring !== 2 && ring !== 4);
				}
		}
		const positions = alignmentPositions(this.version);
		const last = positions.length - 1;
		positions.forEach((cx, i) =>
			positions.forEach((cy, j) => {
				// Not where the finder patterns are.
				if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
				for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
			})
		);
		// Reserved now, filled in for real once the mask is chosen.
		this.drawFormat(0);
		this.drawVersion();
	}

	/** Level M (format bits 00) and the mask, twice, with BCH error correction. */
	drawFormat(mask: number) {
		const data = mask;
		let rem = data;
		for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
		const bits = ((data << 10) | rem) ^ 0x5412;
		const bit = (i: number) => ((bits >>> i) & 1) !== 0;
		const { size } = this;
		for (let i = 0; i <= 5; i++) this.set(8, i, bit(i));
		this.set(8, 7, bit(6));
		this.set(8, 8, bit(7));
		this.set(7, 8, bit(8));
		for (let i = 9; i < 15; i++) this.set(14 - i, 8, bit(i));
		for (let i = 0; i < 8; i++) this.set(size - 1 - i, 8, bit(i));
		for (let i = 8; i < 15; i++) this.set(8, size - 15 + i, bit(i));
		this.set(8, size - 8, true);
	}

	drawVersion() {
		if (this.version < 7) return;
		let rem = this.version;
		for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
		const bits = (this.version << 12) | rem;
		for (let i = 0; i < 18; i++) {
			const dark = ((bits >>> i) & 1) !== 0;
			const a = this.size - 11 + (i % 3);
			const b = Math.floor(i / 3);
			this.set(a, b, dark);
			this.set(b, a, dark);
		}
	}

	/** The codewords in the zigzag order, two columns at a time from the bottom right. */
	drawData(codewords: number[]) {
		const { size } = this;
		let i = 0;
		for (let right = size - 1; right >= 1; right -= 2) {
			if (right === 6) right = 5;
			for (let vertical = 0; vertical < size; vertical++) {
				for (let j = 0; j < 2; j++) {
					const x = right - j;
					const upward = ((right + 1) & 2) === 0;
					const y = upward ? size - 1 - vertical : vertical;
					if (!this.fixed[y][x] && i < codewords.length * 8) {
						this.dark[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
						i++;
					}
				}
			}
		}
	}

	applyMask(mask: number) {
		for (let y = 0; y < this.size; y++)
			for (let x = 0; x < this.size; x++) if (!this.fixed[y][x] && MASKS[mask](x, y)) this.dark[y][x] = !this.dark[y][x];
	}

	/** The standard's penalty: long runs, 2×2 blocks, finder-like patterns, an uneven share of dark. */
	penalty(): number {
		const { size, dark } = this;
		let score = 0;
		const line = (get: (i: number) => boolean) => {
			let run = 1;
			for (let i = 1; i <= size; i++) {
				if (i < size && get(i) === get(i - 1)) run++;
				else {
					if (run >= 5) score += run - 2;
					run = 1;
				}
			}
			for (let i = 0; i + 11 <= size; i++) {
				const bits = Array.from({ length: 11 }, (_, k) => get(i + k));
				const core = [true, false, true, true, true, false, true];
				const matches = (offset: number) => core.every((value, k) => bits[offset + k] === value);
				const light = (from: number) => bits.slice(from, from + 4).every((value) => !value);
				if ((matches(0) && light(7)) || (matches(4) && light(0))) score += 40;
			}
		};
		for (let y = 0; y < size; y++) line((x) => dark[y][x]);
		for (let x = 0; x < size; x++) line((y) => dark[y][x]);
		for (let y = 0; y + 1 < size; y++)
			for (let x = 0; x + 1 < size; x++) {
				const value = dark[y][x];
				if (value === dark[y][x + 1] && value === dark[y + 1][x] && value === dark[y + 1][x + 1]) score += 3;
			}
		const darkCount = dark.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
		score += Math.floor(Math.abs((darkCount * 20) / (size * size) - 10)) * 10;
		return score;
	}
}

/** The QR code of a text as rows of modules, true for dark; without the quiet zone. */
export function qrModules(text: string): boolean[][] {
	const bytes = [...new TextEncoder().encode(text)];
	let version = 1;
	const lengthBits = (v: number) => (v < 10 ? 8 : 16);
	while (version <= MAX_VERSION && 4 + lengthBits(version) + bytes.length * 8 > dataCodewords(version) * 8) version++;
	if (version > MAX_VERSION) throw new Error('Text too long for a ticket code');

	const bits: number[] = [];
	const push = (value: number, length: number) => {
		for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
	};
	push(0b0100, 4);
	push(bytes.length, lengthBits(version));
	for (const byte of bytes) push(byte, 8);
	const capacity = dataCodewords(version) * 8;
	push(0, Math.min(4, capacity - bits.length));
	push(0, (8 - (bits.length % 8)) % 8);
	const data: number[] = [];
	for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
	for (let pad = 0xec; data.length < dataCodewords(version); pad ^= 0xec ^ 0x11) data.push(pad);

	const codewords = withErrorCorrection(data, version);
	let best: Grid | undefined;
	let bestScore = Infinity;
	for (let mask = 0; mask < MASKS.length; mask++) {
		const grid = new Grid(version);
		grid.drawPatterns();
		grid.drawData(codewords);
		grid.applyMask(mask);
		grid.drawFormat(mask);
		const score = grid.penalty();
		if (score < bestScore) [best, bestScore] = [grid, score];
	}
	return best!.dark;
}

/** The QR code as an SVG path in module units, with a quiet zone of `quiet` modules around it. */
export function qrPath(text: string, quiet = 4): { path: string; size: number } {
	const modules = qrModules(text);
	let path = '';
	modules.forEach((row, y) => {
		for (let x = 0; x < row.length; x++) {
			if (!row[x]) continue;
			// One rectangle per run of dark modules in a row keeps the path short.
			let end = x;
			while (end + 1 < row.length && row[end + 1]) end++;
			path += `M${x + quiet} ${y + quiet}h${end - x + 1}v1h${-(end - x + 1)}z`;
			x = end;
		}
	});
	return { path, size: modules.length + quiet * 2 };
}
