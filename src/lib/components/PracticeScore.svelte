<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import type { OpenScore } from '#lib/music/score-reader.ts';
	import { MARK_COLORS, strokePath, thinPoints, type MarkColor, type Stroke } from '#lib/practice/marks.ts';
	import Icon from './Icon.svelte';

	/**
	 * A part in the practice viewer: one page at a time, fitted to the screen or to its width,
	 * turned by tapping the left or right half, with the arrow and page keys, or a page-turn
	 * pedal (they send those keys). Full screen on request. With the pen, the member's own
	 * marks go on the page; they are saved a moment after the pen stops.
	 */
	let { file, marks: saved }: { file: string; marks: Record<number, Stroke[]> } = $props();

	let score = $state<OpenScore | null>(null);
	let pages = $state(0);
	let page = $state(1);
	let failed = $state(false);
	let fit = $state<'page' | 'width'>('page');
	let full = $state(false);
	let root = $state<HTMLDivElement>();
	let stage = $state<HTMLDivElement>();
	let slot = $state<HTMLDivElement>();
	let stageWidth = $state(0);
	let stageHeight = $state(0);
	/** The current page's size on screen. */
	let size = $state<{ width: number; height: number } | null>(null);

	$effect(() => {
		const id = file;
		let opened: OpenScore | null = null;
		let cancelled = false;
		failed = false;
		(async () => {
			try {
				const { openScore } = await import('#lib/music/score-reader.ts');
				opened = await openScore(id);
				if (cancelled) return void opened.destroy();
				score = opened;
				pages = opened.doc.numPages;
				page = 1;
			} catch {
				if (!cancelled) failed = true;
			}
		})();
		return () => {
			cancelled = true;
			opened?.destroy();
		};
	});

	// Drawn pages, kept for the pages next to the current one, so turning is instant.
	const drawn = new Map<string, HTMLCanvasElement>();
	const sizes = new Map<number, { width: number; height: number }>();
	let queue: Promise<unknown> = Promise.resolve();

	async function baseSize(current: OpenScore, number: number) {
		let found = sizes.get(number);
		if (!found) {
			const { pageSize } = await import('#lib/music/score-reader.ts');
			found = await pageSize(current, number);
			sizes.set(number, found);
		}
		return found;
	}

	function fitted(base: { width: number; height: number }) {
		const scale = fit === 'page' ? Math.min(stageWidth / base.width, stageHeight / base.height) : stageWidth / base.width;
		return { width: Math.max(100, Math.floor(base.width * scale)), height: Math.max(100, Math.floor(base.height * scale)) };
	}

	/** One page at one width; drawn one at a time, as pdf.js likes it. */
	function canvasFor(current: OpenScore, number: number, width: number): Promise<HTMLCanvasElement> {
		const key = `${number}@${width}`;
		const ready = drawn.get(key);
		if (ready) return Promise.resolve(ready);
		const next = queue.then(async () => {
			const again = drawn.get(key);
			if (again) return again;
			const { renderPage } = await import('#lib/music/score-reader.ts');
			const canvas = document.createElement('canvas');
			await renderPage(current, number, canvas, width);
			drawn.set(key, canvas);
			// Phones have little memory for canvases: only the last few.
			while (drawn.size > 4) drawn.delete(drawn.keys().next().value!);
			return canvas;
		});
		queue = next.catch(() => {});
		return next;
	}

	let shown = 0;
	$effect(() => {
		if (!score || !slot || !stageWidth || !stageHeight) return;
		const [current, number, mode] = [score, page, fit];
		const token = ++shown;
		void mode;
		(async () => {
			try {
				const target = fitted(await baseSize(current, number));
				const canvas = await canvasFor(current, number, target.width);
				if (token !== shown) return;
				size = target;
				slot!.replaceChildren(canvas);
				if (fit === 'width') stage?.scrollTo({ top: 0 });
				// The neighbours, ready for the next turn.
				for (const other of [number + 1, number - 1]) {
					if (other < 1 || other > pages) continue;
					canvasFor(current, other, fitted(await baseSize(current, other)).width).catch(() => {});
				}
			} catch {
				if (token === shown) failed = true;
			}
		})();
	});

	function turn(step: number) {
		const next = Math.min(pages, Math.max(1, page + step));
		if (next !== page) {
			finishStroke();
			page = next;
		}
	}

	/** With the page at its width: down the page first, then to the next one. */
	function forward() {
		if (fit === 'width' && stage && stage.scrollTop + stage.clientHeight < stage.scrollHeight - 4) stage.scrollBy({ top: stage.clientHeight * 0.85, behavior: 'smooth' });
		else turn(1);
	}
	function back() {
		if (fit === 'width' && stage && stage.scrollTop > 4) stage.scrollBy({ top: -stage.clientHeight * 0.85, behavior: 'smooth' });
		else turn(-1);
	}

	const NEXT = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter']);
	const PREVIOUS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']);
	function onkeydown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
		// Space and Enter on a button press the button.
		if ((event.key === ' ' || event.key === 'Enter') && target?.closest('button, a')) return;
		if (event.key === 'Escape' && full) return void leaveFull();
		if (NEXT.has(event.key)) forward();
		else if (PREVIOUS.has(event.key)) back();
		else if (event.key === 'Home') turn(-pages);
		else if (event.key === 'End') turn(pages);
		else return;
		event.preventDefault();
	}

	/** Tapping the left half goes back, the right half forward; not while drawing. */
	function onstageclick(event: MouseEvent) {
		if (pen || !stage) return;
		const rect = stage.getBoundingClientRect();
		if (event.clientX - rect.left < rect.width / 2) back();
		else forward();
	}

	// Full screen: the browser's where it has one (not on iPhones), else the page covers the window.
	async function enterFull() {
		full = true;
		try {
			const element = root as (HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }) | undefined;
			await (element?.requestFullscreen?.() ?? element?.webkitRequestFullscreen?.());
		} catch {
			// The covering layout is enough.
		}
	}
	function leaveFull() {
		full = false;
		if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
	}
	$effect(() => {
		const changed = () => {
			if (!document.fullscreenElement) full = false;
		};
		document.addEventListener('fullscreenchange', changed);
		return () => document.removeEventListener('fullscreenchange', changed);
	});

	// The pen.
	let marks = $state<Record<number, Stroke[]>>({});
	$effect.pre(() => {
		marks = { ...saved };
	});
	let pen = $state(false);
	let color = $state<MarkColor | 'eraser'>('graphite');
	let drawing = $state<Stroke | null>(null);
	let saving = $state<'idle' | 'saving' | 'saved' | 'failed'>('idle');
	const history = new Map<number, Stroke[][]>();
	const timers = new Map<number, ReturnType<typeof setTimeout>>();
	const current = $derived(marks[page] ?? []);

	function change(number: number, next: Stroke[]) {
		const before = history.get(number) ?? [];
		before.push(marks[number] ?? []);
		history.set(number, before.slice(-50));
		marks = { ...marks, [number]: next };
		saveSoon(number);
	}

	function saveSoon(number: number) {
		clearTimeout(timers.get(number));
		saving = 'saving';
		timers.set(number, setTimeout(() => save(number), 1200));
	}

	async function save(number: number, keepalive = false) {
		timers.delete(number);
		try {
			const response = await fetch('/api/ueben/notizen', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ file, page: number, strokes: marks[number] ?? [] }),
				keepalive
			});
			if (!timers.size) saving = response.ok ? 'saved' : 'failed';
		} catch {
			saving = 'failed';
		}
	}

	// Leaving the page: what's still waiting goes out now.
	$effect(() => () => {
		for (const [number, timer] of timers) {
			clearTimeout(timer);
			save(number, true);
		}
	});

	function point(event: PointerEvent, element: Element): [number, number] {
		const rect = element.getBoundingClientRect();
		return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height];
	}

	let erasing = false;
	function erase([x, y]: [number, number]) {
		const near = (stroke: Stroke) => {
			for (let i = 0; i < stroke.points.length; i += 2) if (Math.hypot(stroke.points[i] - x, stroke.points[i + 1] - y) < 0.02) return true;
			return false;
		};
		const kept = current.filter((stroke) => !near(stroke));
		if (kept.length === current.length) return;
		// One undo step for a whole wipe.
		if (!erasing) change(page, kept);
		else marks = { ...marks, [page]: kept };
		erasing = true;
		saveSoon(page);
	}

	function down(event: PointerEvent) {
		if (!pen) return;
		event.preventDefault();
		const element = event.currentTarget as Element;
		element.setPointerCapture(event.pointerId);
		if (color === 'eraser') {
			erasing = false;
			erase(point(event, element));
		} else drawing = { color, points: point(event, element) };
	}
	function move(event: PointerEvent) {
		if (!pen || !(event.buttons || event.pointerType === 'touch')) return;
		const element = event.currentTarget as Element;
		if (color === 'eraser') return erase(point(event, element));
		if (!drawing) return;
		// Pens report many points between frames; all of them make a smoother line.
		const events = event.getCoalescedEvents?.() ?? [event];
		const added = events.flatMap((each) => point(each, element));
		drawing = { ...drawing, points: [...drawing.points, ...added] };
	}
	function finishStroke() {
		erasing = false;
		if (!drawing) return;
		const stroke = { ...drawing, points: thinPoints(drawing.points) };
		drawing = null;
		change(page, [...current, stroke]);
	}

	function undo() {
		const before = history.get(page);
		const last = before?.pop();
		if (last === undefined) return;
		marks = { ...marks, [page]: last };
		saveSoon(page);
	}

	function clear() {
		if (!current.length || !confirm(t.practice.marks.confirmClear)) return;
		change(page, []);
	}

	const STROKE: Record<MarkColor, string> = { graphite: 'var(--mark-graphite)', red: 'var(--mark-red)', blue: 'var(--mark-blue)' };
	const strokeWidth = $derived(Math.max(1.5, (size?.width ?? 600) * 0.0032));
</script>

<svelte:window {onkeydown} />

<div class="score" class:full bind:this={root}>
	<div class="bar">
		<div class="group">
			<button type="button" class="tool" onclick={back} disabled={page <= 1 && fit === 'page'} aria-label={t.viewer.previous}><Icon name="back" size={16} /></button>
			<span class="pages">{t.viewer.page(page, pages || 1)}</span>
			<button type="button" class="tool" onclick={forward} disabled={page >= pages && fit === 'page'} aria-label={t.viewer.next}><Icon name="chevron" size={16} /></button>
		</div>
		<div class="group">
			<button type="button" class="tool text" onclick={() => (fit = fit === 'page' ? 'width' : 'page')}>
				{fit === 'page' ? t.practice.viewer.fitWidth : t.practice.viewer.fitPage}
			</button>
			<button type="button" class="tool text" class:on={pen} aria-pressed={pen} onclick={() => (pen ? (finishStroke(), (pen = false)) : (pen = true))}>
				<Icon name="edit" size={15} />{t.practice.marks.pen}
			</button>
			<button type="button" class="tool text" onclick={() => (full ? leaveFull() : enterFull())} aria-pressed={full}>
				{full ? t.practice.viewer.exitFullscreen : t.practice.viewer.fullscreen}
			</button>
		</div>
	</div>

	{#if pen}
		<div class="bar pen" role="toolbar" aria-label={t.practice.marks.title}>
			<div class="group">
				{#each MARK_COLORS as each (each)}
					<button type="button" class="swatch {each}" class:on={color === each} aria-pressed={color === each} onclick={() => (color = each)} title={t.practice.marks[each]}>
						<span class="dot"></span><span class="label">{t.practice.marks[each]}</span>
					</button>
				{/each}
				<button type="button" class="tool text" class:on={color === 'eraser'} aria-pressed={color === 'eraser'} onclick={() => (color = 'eraser')}>{t.practice.marks.eraser}</button>
			</div>
			<div class="group">
				<button type="button" class="tool text" onclick={undo}>{t.practice.marks.undo}</button>
				<button type="button" class="tool text" onclick={clear} disabled={!current.length}>{t.practice.marks.clear}</button>
				<span class="state" class:failed={saving === 'failed'} role="status">
					{saving === 'saving' ? t.practice.marks.saving : saving === 'saved' ? t.practice.marks.saved : saving === 'failed' ? t.practice.marks.failed : t.practice.marks.private}
				</span>
			</div>
		</div>
	{/if}

	<!-- Taps on the page turn it; the keys and pedals work anywhere on the page. -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="stage" class:width={fit === 'width'} bind:this={stage} bind:clientWidth={stageWidth} bind:clientHeight={stageHeight} onclick={onstageclick}>
		{#if failed}
			<p class="msg error">{t.practice.viewer.failed}</p>
		{:else if !score}
			<p class="note">{t.viewer.loading}</p>
		{/if}
		<div class="sheet" style:width={size ? `${size.width}px` : undefined} style:height={size ? `${size.height}px` : undefined} hidden={!score || failed}>
			<div class="slot" bind:this={slot}></div>
			{#if size}
				<svg
					class="marks"
					class:drawing={pen}
					viewBox="0 0 {size.width} {size.height}"
					width={size.width}
					height={size.height}
					onpointerdown={down}
					onpointermove={move}
					onpointerup={finishStroke}
					onpointercancel={finishStroke}
					aria-hidden="true"
				>
					{#each [...current, ...(drawing ? [drawing] : [])] as stroke, i (i)}
						<path d={strokePath(stroke.points, size.width, size.height)} stroke={STROKE[stroke.color]} stroke-width={strokeWidth} />
					{/each}
				</svg>
			{/if}
		</div>
	</div>
	{#if !full}<p class="hint">{t.practice.viewer.turnHint}</p>{/if}
</div>

<style>
	.score {
		--mark-graphite: #4a4a4a;
		--mark-red: #d0342c;
		--mark-blue: #1f5fd1;
		display: grid;
		gap: var(--space-2);
	}

	.score.full {
		position: fixed;
		inset: 0;
		z-index: 1000;
		grid-template-rows: auto auto 1fr;
		padding: var(--space-2);
		background: var(--bg);
	}

	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1);
	}

	.pages {
		min-width: 7.5em;
		color: var(--text-muted);
		font-size: 0.875rem;
		text-align: center;
	}

	.tool,
	.swatch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		min-width: 40px;
		height: 40px;
		padding: 0 var(--space-2);
		border: 1px solid var(--hairline);
		border-radius: 10px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.tool:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.tool.on,
	.swatch.on {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
	}

	.dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
	}

	.graphite .dot {
		background: var(--mark-graphite);
	}

	.red .dot {
		background: var(--mark-red);
	}

	.blue .dot {
		background: var(--mark-blue);
	}

	.state {
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.state.failed {
		color: var(--danger);
	}

	.stage {
		display: grid;
		place-items: start center;
		height: calc(100dvh - 220px);
		min-height: 360px;
		overflow: hidden;
		user-select: none;
		-webkit-user-select: none;
	}

	.full .stage {
		height: auto;
		min-height: 0;
	}

	.stage.width {
		overflow-y: auto;
	}

	.sheet {
		position: relative;
		border: 1px solid var(--hairline);
		background: #fff;
	}

	.slot :global(canvas) {
		display: block;
	}

	.marks {
		position: absolute;
		inset: 0;
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
		pointer-events: none;
	}

	.marks.drawing {
		pointer-events: auto;
		touch-action: none;
		cursor: crosshair;
	}

	.note {
		color: var(--text-muted);
	}

	.hint {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	@media (max-width: 560px) {
		.swatch .label {
			display: none;
		}
	}
</style>
