export const AUTH_COOKIE_NAME = 'sb-sanatkar-auth';

// The browser owns refresh-token rotation. The server receives only an access token.
export function authCookieValue(session: { access_token: string; expires_at?: number }) {
  return JSON.stringify({ access_token: session.access_token, expires_at: session.expires_at });
}

export function readAuthAccessToken(value?: string | null): string | null {
  if (!value) return null;
  try {
    const session = JSON.parse(value);
    return typeof session?.access_token === 'string' && session.access_token.length > 0 ? session.access_token : null;
  } catch { return null; }
}

export function authCookieOptions() {
  return { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 604800 };
}
