// Node's file system, used by qr.test.ts to load ZXing's WebAssembly; the app has no Node type definitions.
declare module 'node:fs' {
	export function readFileSync(path: string | URL): Uint8Array;
}
