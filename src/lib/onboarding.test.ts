import { describe, expect, it } from 'vitest';
import { shouldWelcome } from './onboarding';

describe('onboarding', () => {
	it('welcomes a first-time visitor', () => {
		expect(shouldWelcome(false, 0)).toBe(true);
	});

	it('skips the welcome once it was finished', () => {
		expect(shouldWelcome(true, 0)).toBe(false);
	});

	it('skips the welcome for learners who already have progress', () => {
		expect(shouldWelcome(false, 4)).toBe(false);
	});
});
