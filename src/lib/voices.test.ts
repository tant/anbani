import { describe, expect, it } from 'vitest';
import { nextTake } from './voices.svelte';

describe('nextTake', () => {
	it('walks through the takes in turn and wraps around', () => {
		const urls = ['a', 'b', 'c'];
		expect([1, 2, 3, 4].map(() => nextTake('letter:ა', urls))).toEqual(['a', 'b', 'c', 'a']);
	});

	it('keeps a separate turn per item', () => {
		expect(nextTake('word:x', ['x1', 'x2'])).toBe('x1');
		expect(nextTake('word:y', ['y1', 'y2'])).toBe('y1');
		expect(nextTake('word:x', ['x1', 'x2'])).toBe('x2');
	});

	it('plays the only take when there is one', () => {
		expect(nextTake('one', ['only'])).toBe('only');
		expect(nextTake('one', ['only'])).toBe('only');
	});
});
