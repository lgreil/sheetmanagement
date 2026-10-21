import { error, redirect } from '@sveltejs/kit';
import jbig2 from 'pdfjs-dist/wasm/jbig2.wasm?url';
import openjpeg from 'pdfjs-dist/wasm/openjpeg.wasm?url';
import qcms from 'pdfjs-dist/wasm/qcms_bg.wasm?url';
import type { RequestHandler } from './$types';

/**
 * pdf.js decodes scanned images (JBIG2, JPEG 2000) and colour profiles with WebAssembly
 * files it loads by name from one folder (`wasmUrl` in score-reader.ts). Vite bundles them
 * under hashed names, so this folder only points to them.
 */
const FILES: Record<string, string> = { 'jbig2.wasm': jbig2, 'openjpeg.wasm': openjpeg, 'qcms_bg.wasm': qcms };

export const GET: RequestHandler = ({ params }) => {
	const url = FILES[params.file];
	if (!url) error(404, 'Not found');
	redirect(302, url);
};
