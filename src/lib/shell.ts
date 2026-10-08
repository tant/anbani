/**
 * Whether a navigation response is fit to become the offline shell.
 *
 * Every deploy has a short window where the proxy answers 502 while the new container takes over,
 * and whoever opens the app in that window would otherwise store the error page as the thing their
 * app shows with no network. Only a real page from this origin is kept.
 */
export function worthKeeping(response: { ok: boolean; url: string }, origin: string) {
	if (!response.ok) return false;
	try {
		// A redirect that left this origin must not end up stored as our own shell.
		return new URL(response.url).origin === origin;
	} catch {
		return false;
	}
}

/** A server error is worth answering from the last good copy, rather than showing the proxy's page. */
export const preferCached = (response: { status: number }) => response.status >= 500;
