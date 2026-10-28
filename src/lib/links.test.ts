import { describe, expect, it } from 'vitest';
import { bachkreis } from '#lib/config/presets/bachkreis.ts';
import { cleanLink, linksText, orchestraLinks, parseLinks, youtubeId } from './links.ts';

describe('orchestraLinks', () => {
	it('keeps set web links with a label, defaulting the icon to a globe', () => {
		expect(
			orchestraLinks([
				{ label: 'Website', url: 'https://example.org' },
				{ label: 'Instagram', url: 'https://instagram.com/example', icon: 'instagram' },
				{ label: 'Kaputt', url: 'javascript:alert(1)' },
				{ label: 'Leer', url: '' },
				{ label: ' ', url: 'https://example.org/ohne-namen' }
			])
		).toEqual([
			{ label: 'Website', url: 'https://example.org/', icon: 'globe' },
			{ label: 'Instagram', url: 'https://instagram.com/example', icon: 'instagram' }
		]);
	});

	it('shows nothing when no links are configured', () => {
		expect(orchestraLinks(undefined)).toEqual([]);
	});

	it('never links the source code for the Bachkreis', () => {
		expect(bachkreis.sourceUrl).toBeUndefined();
	});
});

describe('parseLinks', () => {
	it('reads names and links separated by ";" or new lines, with the icon from the site', () => {
		expect(parseLinks('Website https://example.org; Instagram https://www.instagram.com/orchester/\nFacebook: https://de-de.facebook.com/x')).toEqual([
			{ label: 'Website', url: 'https://example.org/', icon: 'globe' },
			{ label: 'Instagram', url: 'https://www.instagram.com/orchester/', icon: 'instagram' },
			{ label: 'Facebook', url: 'https://de-de.facebook.com/x', icon: 'globe' }
		]);
	});

	it('names a link without a name after its site', () => {
		expect(parseLinks('https://youtu.be/x https://www.example.org/a').map((link) => link.label)).toEqual(['YouTube', 'example.org']);
	});

	it('is nothing when nothing is set', () => {
		expect(parseLinks(undefined)).toEqual([]);
		expect(parseLinks('  ')).toEqual([]);
	});

	it('writes them back as the field shows them', () => {
		const links = parseLinks('Website https://example.org; Instagram https://www.instagram.com/orchester/');
		expect(parseLinks(linksText(links))).toEqual(links);
	});
});

describe('cleanLink', () => {
	it('brings every YouTube link form to watch?v=<id>', () => {
		const clean = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
		for (const link of [
			'https://youtu.be/dQw4w9WgXcQ?si=AbCdEf123',
			'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123&index=4&pp=ygU',
			'https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ',
			'https://youtube.com/shorts/dQw4w9WgXcQ?feature=share',
			'https://www.youtube.com/embed/dQw4w9WgXcQ',
			'https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=xyz',
			'  https://www.youtube.com/live/dQw4w9WgXcQ  '
		])
			expect(cleanLink(link)).toBe(clean);
	});

	it('keeps a start time, in seconds', () => {
		expect(cleanLink('https://youtu.be/dQw4w9WgXcQ?t=95')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=95s');
		expect(cleanLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m35s&si=x')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=95s');
	});

	it('drops tracking from other links and keeps the rest', () => {
		expect(cleanLink('https://open.spotify.com/track/abc?si=123&utm_source=copy')).toBe('https://open.spotify.com/track/abc');
		expect(cleanLink('https://example.org/aufnahme?id=7&fbclid=x')).toBe('https://example.org/aufnahme?id=7');
	});

	it('refuses what is not a web link, like safeLink', () => {
		expect(cleanLink('javascript:alert(1)')).toBeUndefined();
		expect(cleanLink('kein Link')).toBeUndefined();
		expect(cleanLink('')).toBeUndefined();
	});

	it('leaves a YouTube page without a video as it is', () => {
		expect(youtubeId('https://www.youtube.com/results?search_query=egmont')).toBeUndefined();
		expect(cleanLink('https://www.youtube.com/@orchester')).toBe('https://www.youtube.com/@orchester');
	});
});
