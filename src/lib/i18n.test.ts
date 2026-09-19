import { describe, expect, it } from 'vitest';
import { format, relativeTime, translate } from './i18n';
import { en, vi } from './messages';

describe('i18n', () => {
	it('has the same keys in both languages', () => {
		expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
	});

	it('fills parameters and leaves unknown ones', () => {
		expect(format('{n} of {total}', { n: 3 })).toBe('3 of {total}');
	});

	it('translates with parameters', () => {
		expect(translate('en', 'choicesValue', { n: 4 })).toBe('4 choices');
		expect(translate('vi', 'choicesValue', { n: 4 })).toBe('4 lựa chọn');
	});

	it('formats relative times', () => {
		const now = new Date('2026-01-01T00:00:00Z');
		expect(relativeTime(new Date(+now + 5 * 60_000), now, 'en')).toBe('in 5 minutes');
		expect(relativeTime(new Date(+now + 3 * 86_400_000), now, 'en')).toBe('in 3 days');
	});
});
