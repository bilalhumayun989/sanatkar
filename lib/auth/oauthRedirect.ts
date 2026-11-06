/** Build the app's OAuth callback, preferring the canonical deployment URL. */
export function getOAuthRedirectTo(next?: string | null) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  let origin = window.location.origin;

  if (configuredUrl) {
    try {
      const configured = new URL(configuredUrl);
      const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(configured.hostname);
      if ((configured.protocol === 'https:' || configured.protocol === 'http:') && !isLocalhost) {
        origin = configured.origin;
      }
    } catch {
      // Keep the current browser origin if the optional URL is malformed.
    }
  }

  const callback = new URL('/auth/callback', origin);
  if (next) callback.searchParams.set('next', next);
  return callback.toString();
}
