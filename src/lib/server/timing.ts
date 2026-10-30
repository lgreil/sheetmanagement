/**
 * How long the parts of an answer took (#187), for the browser's network panel and field
 * measurements: settings from the cache, sign-in, then loading and rendering the page.
 * Durations only, nothing about the person.
 */
export function serverTiming(marks: [name: string, ms: number][]): string {
	return marks.map(([name, ms]) => `${name};dur=${Math.round(ms * 10) / 10}`).join(', ');
}
