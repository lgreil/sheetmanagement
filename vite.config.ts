import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

/**
 * pdf.js decodes scanned images (JBIG2, JPEG 2000) and colour profiles with WebAssembly
 * files it loads from one folder (`wasmUrl`). They're served at /pdfjs-wasm/ from the
 * installed pdfjs-dist, in dev and in the build, so they always match its version.
 */
function pdfjsWasm(): Plugin {
	const FILES = ['jbig2.wasm', 'openjpeg.wasm', 'qcms_bg.wasm'];
	const dir = join(dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json')), 'wasm');
	return {
		name: 'pdfjs-wasm',
		configureServer(server) {
			server.middlewares.use('/pdfjs-wasm', (req, res, next) => {
				const name = (req.url ?? '').replace(/^\//, '').split('?')[0];
				if (!FILES.includes(name)) return next();
				res.setHeader('content-type', 'application/wasm');
				res.end(readFileSync(join(dir, name)));
			});
		},
		generateBundle() {
			if (this.environment.name !== 'client') return;
			for (const name of FILES) this.emitFile({ type: 'asset', fileName: `pdfjs-wasm/${name}`, source: readFileSync(join(dir, name)) });
		}
	};
}

export default defineConfig({
	plugins: [sveltekit({ adapter: adapter() }), pdfjsWasm()],
	// Shown next to the source link and on /status.
	define: { __APP_VERSION__: JSON.stringify(pkg.version) },
	test: {
		include: ['src/**/*.test.ts']
	}
});
