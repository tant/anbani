import type { MessageKey } from './messages';

type Failure = { status?: number; response?: { data?: Record<string, { code?: string }> } };

/**
 * PocketBase reports why a sign-up or sign-in failed in per-field codes; the learner needs to know
 * which one it was, not that "something failed".
 */
export function authError(err: unknown, mode: 'in' | 'up', online = true): MessageKey {
	const { status, response } = (err ?? {}) as Failure;
	if (!online || status === 0) return 'offlineError';
	if (status && status >= 500) return 'serverError';

	const fields = response?.data ?? {};
	if (fields.email?.code === 'validation_not_unique') return 'emailTaken';
	if (fields.email?.code) return 'emailInvalid';
	if (fields.password?.code) return 'passwordTooShort';

	return mode === 'in' ? 'wrongCredentials' : 'signUpFailed';
}
