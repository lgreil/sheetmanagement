import { appEnv, isDemo } from './env.ts';

/**
 * A YouTube video's length, as a suggestion for a piece's duration (#133). oEmbed doesn't
 * give it, so this needs the YouTube Data API: a free API key (YOUTUBE_API_KEY, quota 10,000
 * units a day; one lookup costs 1). Without a key the editor doesn't offer it.
 */

/** "PT8M30S", "PT1H2M", "P0D" → seconds; undefined for anything else. */
export function parseIsoDuration(text: string): number | undefined {
	const match = text.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
	if (!match) return undefined;
	const [, days, hours, minutes, seconds] = match.map((part) => Number(part ?? 0));
	return ((days * 24 + hours) * 60 + minutes) * 60 + seconds || undefined;
}

export function youtubeEnabled(): boolean {
	return isDemo() || !!appEnv().YOUTUBE_API_KEY?.trim();
}

/** Videos don't change length; a Worker instance keeps what it looked up. */
const lengths = new Map<string, number | null>();

export async function videoSeconds(id: string): Promise<number | undefined> {
	if (lengths.has(id)) return lengths.get(id) ?? undefined;
	let seconds: number | undefined;
	if (isDemo()) {
		// Invented, but the same for the same video: between 3 and 12 minutes.
		const hash = [...id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 100_000, 7);
		seconds = 180 + (hash % 540);
	} else {
		const key = appEnv().YOUTUBE_API_KEY?.trim();
		if (!key) return undefined;
		const url = new URL('https://www.googleapis.com/youtube/v3/videos');
		url.search = new URLSearchParams({ part: 'contentDetails', id, key }).toString();
		const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
		if (!response.ok) throw new Error(`YouTube answered ${response.status}`);
		const body = (await response.json()) as { items?: { contentDetails?: { duration?: string } }[] };
		const duration = body.items?.[0]?.contentDetails?.duration;
		seconds = duration ? parseIsoDuration(duration) : undefined;
	}
	lengths.set(id, seconds ?? null);
	return seconds;
}
