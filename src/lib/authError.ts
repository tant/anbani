import type { MessageKey } from './messages';

type Failure = { status?: number };

/** Sign-in can only fail three ways now: no connection, a server problem, or Google turning us down. */
export function authError(err: unknown, online = true): MessageKey {
	const { status } = (err ?? {}) as Failure;
	if (!online || status === 0) return 'offlineError';
	if (status && status >= 500) return 'serverError';
	return 'signInRejected';
}
