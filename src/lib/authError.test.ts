import { describe, expect, it } from 'vitest';
import { authError } from './authError';

describe('authError', () => {
	it('blames the connection before anything else', () => {
		expect(authError({ status: 400 }, false)).toBe('offlineError');
		expect(authError({ status: 0 })).toBe('offlineError');
	});

	it('tells a server outage apart from a rejected sign-in', () => {
		expect(authError({ status: 503 })).toBe('serverError');
		expect(authError({ status: 400 })).toBe('signInRejected');
	});

	it('falls back for errors that carry no status', () => {
		expect(authError(new Error('state mismatch'))).toBe('signInRejected');
	});
});
