import { describe, expect, it } from 'vitest';
import { authError } from './authError';

const taken = { status: 400, response: { data: { email: { code: 'validation_not_unique' } } } };
const badEmail = { status: 400, response: { data: { email: { code: 'validation_is_email' } } } };
const shortPassword = { status: 400, response: { data: { password: { code: 'validation_length_out_of_range' } } } };
const refused = { status: 400, response: { data: {} } };

describe('authError', () => {
	it('names the field that failed', () => {
		expect(authError(taken, 'up')).toBe('emailTaken');
		expect(authError(badEmail, 'up')).toBe('emailInvalid');
		expect(authError(shortPassword, 'up')).toBe('passwordTooShort');
	});

	it('separates a wrong password from a wrong sign-up', () => {
		expect(authError(refused, 'in')).toBe('wrongCredentials');
		expect(authError(refused, 'up')).toBe('signUpFailed');
	});

	it('blames the connection before the credentials', () => {
		expect(authError(taken, 'up', false)).toBe('offlineError');
		expect(authError({ status: 0 }, 'in')).toBe('offlineError');
	});

	it('tells a server outage apart from a rejected request', () => {
		expect(authError({ status: 503 }, 'in')).toBe('serverError');
	});
});
