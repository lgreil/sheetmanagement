import { describe, expect, it } from 'vitest';
import { canonicalUrl } from './canonical.ts';

const OWN = 'https://noten.example.org';

describe('canonicalUrl', () => {
	it('sends the workers.dev address to the own domain, with path and query', () => {
		expect(canonicalUrl(new URL('https://noten.orchester.workers.dev/kalender/a1?x=1'), OWN)).toBe('https://noten.example.org/kalender/a1?x=1');
	});

	it('leaves other hosts alone', () => {
		expect(canonicalUrl(new URL('https://noten.example.org/'), OWN)).toBeNull();
		expect(canonicalUrl(new URL('http://localhost:5173/'), OWN)).toBeNull();
		expect(canonicalUrl(new URL('https://scheduled.invalid/api/jobs'), OWN)).toBeNull();
	});

	it('does nothing without APP_URL or with a broken one', () => {
		expect(canonicalUrl(new URL('https://noten.orchester.workers.dev/'), undefined)).toBeNull();
		expect(canonicalUrl(new URL('https://noten.orchester.workers.dev/'), 'not a url')).toBeNull();
	});
});
