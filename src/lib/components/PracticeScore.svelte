<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import type { OpenScore } from '#lib/music/score-reader.ts';
	import { MARK_COLORS, onPage, strokePath, thinPoints, type MarkColor, type Stroke } from '#lib/practice/marks.ts';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	/**
	 * A part in the practice viewer: one page at a time, fitted to the screen or to its width,
	 * turned by tapping the left or right half, with the arrow and page keys, or a page-turn
	 * pedal (they send those keys). Full screen on request. With the pen, the member's own
	 * marks go on the page; they are saved a moment after the pen stops.
	 */
	let {
		file,
		marks: saved,
		tools = [],
		panel,
		pen: penAllowed = true,
		onpast,
		startAt = 'first',
		startFull = false,
		onleave,
		night = false,
		extra
	}: {
		file: string;
		marks: Record<number, Stroke[]>;
		/** The recording, metronome and tuner: one button each in the toolbar. */
		tools?: { value: string; label: string }[];
		/** One tool's panel, shown beside the page where there's room (see `dock`). */
		panel?: Snippet<[tool: string]>;
		/** Off in the concert mode (#194): marks show, nothing is drawn or saved. */
		pen?: boolean;
		/** Turning past the last page (1) or before the first (-1): the next or previous piece. */
		onpast?: (step: 1 | -1) => void;
		/** Where a newly opened part starts: at its end when coming back from the next piece. */
		startAt?: 'first' | 'last';
		/** Opens in full screen (needs the tap that opened it). */
		startFull?: boolean;
		/** Called when full screen ends, by the button, Escape or the browser. */
		onleave?: () => void;
		/** Light notes on black, for a dark stage. */
		night?: boolean;
		/** More controls at the start of the toolbar. */
		extra?: Snippet;
	} = $props();

	/** The tool shown; tools once opened stay mounted, so a metronome or drone keeps going. */
	let active = $state<string | null>(null);
	let opened = $state<string[]>([]);
	function chooseTool(tool: string) {
		active = active === tool ? null : tool;
		if (active && !opened.includes(active)) opened = [...opened, active];
	}

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
				// The concert mode turns on into the next part: its pages, not the last part's.
				drawn.clear();
				sizes.clear();
				score = opened;
				pages = opened.doc.numPages;
				page = startAt === 'last' ? pages : 1;
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
			if (current === score) sizes.set(number, found);
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
			// A page still drawing from the part before isn't kept for this one.
			if (current !== score) return canvas;
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
		} else if (onpast && pages && Math.abs(step) === 1) onpast(step as 1 | -1);
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
		onleave?.();
	}
	$effect(() => {
		if (startFull) enterFull();
	});
	$effect(() => {
		const changed = () => {
			if (!document.fullscreenElement && full) {
				full = false;
				onleave?.();
			}
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
	/** Why the last save failed: the HTTP status, or none when the device was offline. */
	let failure = $state('');
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
		failure = '';
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
			if (!response.ok) {
				failure = String(response.status);
				saving = 'failed';
			} else if (!timers.size && saving !== 'failed') saving = 'saved';
		} catch {
			failure = '';
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
		return [onPage((event.clientX - rect.left) / rect.width), onPage((event.clientY - rect.top) / rect.height)];
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
		// Keeps the line going past the page's edge; a browser that won't still draws on the page.
		try {
			element.setPointerCapture(event.pointerId);
		} catch {
			// Drawn without capture.
		}
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

	// In full screen the controls fade after a few seconds without a touch, so they cover less music.
	let awake = $state(true);
	let sleepy: ReturnType<typeof setTimeout> | undefined;
	function wake() {
		awake = true;
		clearTimeout(sleepy);
		sleepy = setTimeout(() => (awake = false), 3000);
	}
	$effect(() => {
		const element = root;
		if (!element) return;
		element.addEventListener('pointermove', wake, { passive: true });
		element.addEventListener('pointerdown', wake, { passive: true });
		return () => {
			clearTimeout(sleepy);
			element.removeEventListener('pointermove', wake);
			element.removeEventListener('pointerdown', wake);
		};
	});

	/**
	 * Where the tools go, so they never cover the music and the page never shrinks for them:
	 * beside the page where its margin has room (moving the page aside, at the same size, when
	 * only both margins together do), below it where a page narrower than the screen leaves room,
	 * else above it in the page's flow, and only in full screen with no room at all over its foot.
	 */
	const PANEL = 260;
	const GAP = 12;

	/**
	 * In full screen the floating controls would cover the page's head (a phone held upright
	 * has height to spare): the page moves down below them, centred when there's room for that,
	 * and only where the screen is too short does it still go under them.
	 */
	let controlsHeight = $state(0);
	const pageTop = $derived.by(() => {
		if (!full) return 0;
		const clear = controlsHeight + 2 * GAP;
		if (fit === 'width') return clear;
		if (!size) return 0;
		const free = stageHeight - size.height;
		return Math.max(0, Math.min(free, active ? clear : Math.max(free / 2, clear)));
	});
	const dock = $derived.by(() => {
		const width = size?.width ?? stageWidth;
		const height = size?.height ?? stageHeight;
		const free = stageWidth - width;
		// In full screen the floating controls sit in the top right corner.
		const top = full ? 64 : 0;
		if (fit === 'page' && free >= PANEL + GAP) {
			const left = Math.max(0, Math.min((stageWidth - width) / 2, stageWidth - PANEL - GAP - width));
			return { place: 'side', page: left, left: `${left + width + GAP}px`, top: `${top}px`, width: `${Math.min(PANEL + 40, stageWidth - left - width - GAP)}px`, height: `calc(100% - ${top}px)` };
		}
		const below = stageHeight - pageTop - height - GAP;
		if (fit === 'page' && size && below >= 150) {
			const left = (stageWidth - width) / 2;
			return { place: 'below', page: left, left: `${left}px`, top: `${pageTop + height + GAP}px`, width: `${width}px`, height: `${below}px` };
		}
		const centred = Math.max(0, (stageWidth - width) / 2);
		return { place: full ? 'over' : 'above', page: centred, left: undefined, top: undefined, width: undefined, height: undefined };
	});
	/** The page's left edge in the stage: centred, or moved aside for the tools. */
	const pageLeft = $derived(active ? dock.page : Math.max(0, ((size ? stageWidth - size.width : 0) / 2)));

	const STROKE: Record<MarkColor, string> = { graphite: 'var(--mark-graphite)', red: 'var(--mark-red)', blue: 'var(--mark-blue)' };
	const strokeWidth = $derived(Math.max(1.5, (size?.width ?? 600) * 0.0032));
</script>

<svelte:window {onkeydown} />

<!-- In full screen the page takes the whole height; the controls float over its corner, faded until touched. -->
<div class="score" class:full class:night bind:this={root}>
	<div class="controls" class:awake bind:offsetHeight={controlsHeight}>
	<div class="bar">
		{#if extra}<div class="group">{@render extra()}</div>{/if}
		<div class="group">
			<button type="button" class="tool" onclick={back} disabled={page <= 1 && fit === 'page' && !onpast} aria-label={t.viewer.previous}><Icon name="back" size={16} /></button>
			<span class="pages">{t.viewer.page(page, pages || 1)}</span>
			<button type="button" class="tool" onclick={forward} disabled={page >= pages && fit === 'page' && !onpast} aria-label={t.viewer.next}><Icon name="chevron" size={16} /></button>
		</div>
		<div class="group">
			<button type="button" class="tool text" onclick={() => (fit = fit === 'page' ? 'width' : 'page')}>
				{fit === 'page' ? t.practice.viewer.fitWidth : t.practice.viewer.fitPage}
			</button>
			{#if penAllowed}
				<button type="button" class="tool text" class:on={pen} aria-pressed={pen} onclick={() => (pen ? (finishStroke(), (pen = false)) : (pen = true))}>
					<Icon name="edit" size={15} />{t.practice.marks.pen}
				</button>
			{/if}
			{#each tools as each (each.value)}
				<button type="button" class="tool text" class:on={active === each.value} aria-expanded={active === each.value} onclick={() => chooseTool(each.value)}>
					{each.label}
				</button>
			{/each}
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
					{saving === 'saving' ? t.practice.marks.saving : saving === 'saved' ? t.practice.marks.saved : saving === 'failed' ? t.practice.marks.failed(failure) : t.practice.marks.private}
				</span>
			</div>
		</div>
	{/if}
	</div>

	<div class="area" class:docked={!!active}>
	<!-- The tools: rendered once, so a running metronome or drone carries on when the panel moves or closes. -->
	{#if panel && opened.length}
		<div class="dock {dock.place}" hidden={!active} style:top={dock.top} style:left={dock.left} style:width={dock.width} style:max-height={dock.height}>
			<button type="button" class="close" onclick={() => (active = null)} aria-label={t.practice.viewer.closeTools}>×</button>
			{#each opened as tool (tool)}
				<div class="tool-panel" hidden={active !== tool}>{@render panel(tool)}</div>
			{/each}
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
		<div
			class="sheet"
			style:width={size ? `${size.width}px` : undefined}
			style:height={size ? `${size.height}px` : undefined}
			style:margin-left={size ? `${pageLeft}px` : undefined}
			style:margin-top={pageTop ? `${pageTop}px` : undefined}
			hidden={!score || failed}
		>
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

	.controls {
		display: grid;
		gap: var(--space-2);
	}

	.score.full {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: block;
		background: var(--bg);
	}

	/* Night: the page inverted, light notes on black, for a dark stage. */
	.score.night.full {
		background: var(--brand-ink);
	}

	.night .sheet {
		filter: invert(1) hue-rotate(180deg);
	}

	.full .controls {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		z-index: 2;
		max-width: calc(100% - 2 * var(--space-2));
		padding: var(--space-1);
		border-radius: var(--radius-m);
		background: color-mix(in oklab, var(--surface) 88%, transparent);
		box-shadow: var(--shadow-raised);
		opacity: 0.3;
		transition: opacity 0.3s var(--ease);
	}

	.full .controls.awake,
	.full .controls:focus-within {
		opacity: 1;
	}

	.full .bar {
		justify-content: flex-end;
	}

	/* The page's area: the stage, and the tools where there's room for them. */
	.area {
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.full .area {
		position: absolute;
		inset: 0;
	}

	.dock {
		position: absolute;
		z-index: 3;
		overflow-y: auto;
		padding: var(--space-3);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-m);
		background: var(--surface);
		box-shadow: var(--shadow);
		container-type: inline-size;
		overscroll-behavior: contain;
	}

	.dock[hidden],
	.tool-panel[hidden] {
		display: none;
	}

	/* No room beside or below: above the page, which keeps its size and moves down. */
	.dock.above {
		position: static;
		order: -1;
		max-width: 720px;
		margin-bottom: var(--space-2);
	}

	/* Full screen without room anywhere: over the page's foot, small, closed with ×. */
	.dock.over {
		top: auto;
		right: var(--space-2);
		bottom: var(--space-2);
		left: var(--space-2);
		max-height: 46%;
		box-shadow: var(--shadow-raised);
	}

	.close {
		position: sticky;
		top: 0;
		z-index: 1;
		float: right;
		width: 30px;
		height: 30px;
		margin: calc(-1 * var(--space-2)) calc(-1 * var(--space-2)) 0 var(--space-1);
		border: 0;
		border-radius: 50%;
		background: color-mix(in oklab, var(--text) 8%, transparent);
		color: var(--text-muted);
		font-size: var(--text-lg);
		line-height: 1;
		cursor: pointer;
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
		font-size: var(--text-sm);
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
		border-radius: var(--radius-control);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: var(--text-sm);
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
		font-size: var(--text-xs);
	}

	.state.failed {
		color: var(--danger);
	}

	.stage {
		display: block;
		height: calc(100dvh - 220px);
		min-height: 360px;
		overflow: hidden;
		user-select: none;
		-webkit-user-select: none;
	}

	/* The page as tall as the screen. */
	.full .stage {
		height: 100%;
		min-height: 0;
	}

	.stage.width {
		overflow-y: auto;
	}

	/* An outline, not a border: the page keeps exactly the size it was fitted to. */
	.sheet {
		position: relative;
		background: #fff;
		box-shadow: 0 0 0 1px var(--hairline);
	}

	.full .sheet {
		box-shadow: none;
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
		font-size: var(--text-xs);
	}

	@media (max-width: 560px) {
		.swatch .label {
			display: none;
		}

		/* A phone: the toolbar's buttons a little smaller, so it stays one or two slim rows. */
		.tool,
		.swatch {
			min-width: 34px;
			height: 34px;
			padding: 0 var(--space-2);
			font-size: var(--text-xs);
		}

		.pages {
			min-width: 6em;
			font-size: var(--text-xs);
		}
	}
</style>
