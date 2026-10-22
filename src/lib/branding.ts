/**
 * The orchestra's colour per deployment (#75). One accent colour is enough: the shades for the
 * light and the dark scheme are derived from it, darkened or lightened just as far as text and
 * buttons need to stay readable (4.5:1, WCAG AA; see #141).
 */

/** The page backgrounds and the text on buttons the shades are checked against, as in app.css. */
const LIGHT_BG = '#f4f4f1';
const DARK_BG = '#0b0b0a';
const DARK_INK = '#0b0b0a';
const WHITE = '#ffffff';
const MIN_CONTRAST = 4.5;

/** Ready-made accents offered on /einstellungen; each reads well in both schemes once derived. */
export const COLOUR_PRESETS = {
	gold: '#e6b422',
	navy: '#2c5d8f',
	petrol: '#0f766e',
	forest: '#3f7d3a',
	bordeaux: '#9f1239',
	violet: '#6d28d9'
} as const;

/** "#e6b422" or "#E6B422" or "#eb2" → "#e6b422"; anything else undefined, since it ends up in a <style>. */
export function parseColour(text: string | undefined): string | undefined {
	const value = text?.trim().toLowerCase() ?? '';
	if (/^#[0-9a-f]{6}$/.test(value)) return value;
	if (/^#[0-9a-f]{3}$/.test(value)) return '#' + [...value.slice(1)].map((digit) => digit + digit).join('');
	return undefined;
}

type Rgb = [number, number, number];

const rgb = (hex: string): Rgb => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)) as Rgb;
const hex = (colour: Rgb) => '#' + colour.map((part) => Math.round(part).toString(16).padStart(2, '0')).join('');

function luminance(colour: string): number {
	const [r, g, b] = rgb(colour).map((part) => {
		const c = part / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colours, 1 to 21. */
export function contrast(a: string, b: string): number {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
}

/** `colour` moved `amount` (0–1) of the way towards `target`. */
function mix(colour: string, target: string, amount: number): string {
	const from = rgb(colour);
	const to = rgb(target);
	return hex(from.map((part, i) => part + (to[i] - part) * amount) as Rgb);
}

/** The least change towards `target` that passes `ok`, in steps of 5 %. */
function shift(colour: string, target: string, ok: (shade: string) => boolean): string {
	for (let step = 0; step <= 20; step++) {
		const shade = mix(colour, target, step / 20);
		if (ok(shade)) return shade;
	}
	return target;
}

export interface BrandColours {
	/** The colour as set, for soft backgrounds and the browser's theme colour. */
	brand: string;
	/** Accent for text and buttons (with white text) on the light page. */
	light: string;
	/** Accent on the dark page. */
	dark: string;
	/** Text on dark-scheme buttons: near-black or white, whichever reads better. */
	ink: string;
	/** Whether a shade had to be darkened or lightened; /status says so. */
	adjusted: { light: boolean; dark: boolean };
}

export function brandColours(brand: string): BrandColours {
	const light = shift(brand, '#000000', (shade) => contrast(shade, LIGHT_BG) >= MIN_CONTRAST && contrast(shade, WHITE) >= MIN_CONTRAST);
	const dark = shift(brand, WHITE, (shade) => contrast(shade, DARK_BG) >= MIN_CONTRAST);
	const ink = contrast(dark, DARK_INK) >= contrast(dark, WHITE) ? DARK_INK : WHITE;
	return { brand, light, dark, ink, adjusted: { light: light !== brand, dark: dark !== brand } };
}

/**
 * The CSS custom properties app.css derives its theme from. `:root:root` outranks app.css's
 * defaults on `:root`, whichever stylesheet the browser loads last.
 */
export function brandStyle(colours: BrandColours, lightOverride?: string): string {
	return `:root:root{--brand:${colours.brand};--brand-ink:${colours.ink};--accent-light:${lightOverride ?? colours.light};--accent-dark:${colours.dark}}`;
}
