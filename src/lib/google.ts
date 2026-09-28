import { pb } from './pb';
import { load, save } from './storage';

/**
 * Redirect flow, not the SDK's popup helper: an app installed to the iPhone home screen cannot open
 * a second window, and Safari blocks popups opened from an async handler.
 */
const PENDING_KEY = 'oauth-pending';

type Pending = { state: string; verifier: string };

export const redirectUrl = () => `${location.origin}/auth/google`;

/** Sends the browser to Google; the answer comes back at /auth/google. */
export async function startGoogleSignIn() {
	const methods = await pb.collection('users').listAuthMethods();
	const google = methods.oauth2.providers.find((p) => p.name === 'google');
	if (!google) throw new Error('google provider is not enabled');
	save(PENDING_KEY, { state: google.state, verifier: google.codeVerifier } satisfies Pending);
	location.href = google.authURL + encodeURIComponent(redirectUrl());
}

/** Exchanges the code Google handed back; the state must match the one we sent. */
export async function finishGoogleSignIn(params: URLSearchParams) {
	const pending = load<Pending | null>(PENDING_KEY, null);
	const code = params.get('code');
	const state = params.get('state');
	save(PENDING_KEY, null);

	if (params.get('error') || !code) throw new Error(params.get('error') ?? 'missing code');
	if (!pending || pending.state !== state) throw new Error('state mismatch');

	return pb.collection('users').authWithOAuth2Code('google', code, pending.verifier, redirectUrl());
}
