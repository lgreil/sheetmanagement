import { searchText } from '#lib/music/text.ts';

/**
 * Suggestions for an event's location while it's typed: the places the orchestra already
 * played or rehearsed in first, then addresses from OpenStreetMap (Photon). A full address
 * makes the map link on the concert's page find the right place.
 */

export const MAX_PLACES = 6;

/** The fields of a Photon result this app reads (GeoJSON feature properties). */
export interface PhotonPlace {
	name?: string;
	street?: string;
	housenumber?: string;
	postcode?: string;
	city?: string;
	district?: string;
	country?: string;
}

/** "Lambertikirche, Lambertikirchplatz 1, 48143 Münster": name, street and town, without repeats. */
export function placeLabel(place: PhotonPlace): string {
	const street = [place.street, place.housenumber].filter(Boolean).join(' ');
	const town = [place.postcode, place.city ?? place.district].filter(Boolean).join(' ');
	const parts = [place.name, street, town].map((part) => part?.trim()).filter((part): part is string => !!part);
	return parts.filter((part, i) => parts.indexOf(part) === i).join(', ');
}

/** Known places with every typed word in them, the most used first. */
export function matchKnownPlaces(known: string[], query: string): string[] {
	const words = searchText(query).split(/\s+/).filter(Boolean);
	if (!words.length) return [];
	const counts = new Map<string, number>();
	for (const place of known) {
		const trimmed = place.replace(/\s+/g, ' ').trim();
		if (trimmed) counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
	}
	return [...counts]
		.filter(([place]) => {
			const text = searchText(place);
			return words.every((word) => text.includes(word));
		})
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.map(([place]) => place);
}

/** Known places first, then addresses, each once, at most MAX_PLACES. */
export function mergePlaces(known: string[], found: string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const place of [...known, ...found]) {
		const key = searchText(place);
		if (!key || seen.has(key)) continue;
		seen.add(key);
		result.push(place);
	}
	return result.slice(0, MAX_PLACES);
}
