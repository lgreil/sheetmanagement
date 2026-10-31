import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

/**
 * Reading QR codes from the camera at the door (docs/tickets-plan.md §4.4). Chrome on Android
 * has the browser's own BarcodeDetector; iPhones don't, so ZXing in WebAssembly reads the frames
 * there. It is loaded only on the door's page, from the app itself, and kept for offline use.
 */

type Reader = (frame: HTMLVideoElement) => Promise<string | null>;

interface NativeDetector {
	detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare const BarcodeDetector:
	| { new (options: { formats: string[] }): NativeDetector; getSupportedFormats(): Promise<string[]> }
	| undefined;

async function nativeReader(): Promise<Reader | null> {
	if (typeof BarcodeDetector === 'undefined') return null;
	const formats = await BarcodeDetector.getSupportedFormats().catch((): string[] => []);
	if (!formats.includes('qr_code')) return null;
	const detector = new BarcodeDetector({ formats: ['qr_code'] });
	return async (frame) => (await detector.detect(frame).catch(() => []))[0]?.rawValue ?? null;
}

async function zxingReader(): Promise<Reader> {
	const { prepareZXingModule, readBarcodes } = await import('zxing-wasm/reader');
	await prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) }, fireImmediately: true });
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d', { willReadFrequently: true })!;
	return async (frame) => {
		if (!frame.videoWidth) return null;
		// A smaller copy is plenty for a code held up to the phone, and much faster.
		const scale = Math.min(1, 720 / Math.max(frame.videoWidth, frame.videoHeight));
		canvas.width = Math.round(frame.videoWidth * scale);
		canvas.height = Math.round(frame.videoHeight * scale);
		context.drawImage(frame, 0, 0, canvas.width, canvas.height);
		const [result] = await readBarcodes(context.getImageData(0, 0, canvas.width, canvas.height), { formats: ['QRCode'], maxNumberOfSymbols: 1 });
		return result?.isValid ? result.text : null;
	};
}

let reader: Promise<Reader> | undefined;

/** The best reader this browser has; loading it early keeps the first scan quick. */
export const codeReader = () => (reader ??= nativeReader().then((native) => native ?? zxingReader()));
