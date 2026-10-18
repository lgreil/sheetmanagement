import { describe, expect, it } from 'vitest';
import { queryString } from './drive.ts';

describe('queryString', () => {
	it('quotes a plain folder id as is', () => {
		expect(queryString('1G98XaafBHbqCSxDaCzdX7yCYsgnZd9IY')).toBe("'1G98XaafBHbqCSxDaCzdX7yCYsgnZd9IY'");
	});

	it('escapes quotes and backslashes, backslashes first', () => {
		expect(queryString("it's")).toBe("'it\\'s'");
		// A trailing backslash must not escape the closing quote.
		expect(queryString('a\\')).toBe("'a\\\\'");
		expect(queryString("\\'")).toBe("'\\\\\\''");
	});
});
