'use client';
import { refreshOnRealtime } from '@/lib/realtime/client';

import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { fetchJson } from '@/lib/utils/fetchJson';
import { createClient } from '@/lib/auth/supabase/client';

interface User {
    id: string;
    email: string;
    name?: string;
    username?: string;
    role: string;
    seller_status?: string | null;
    seller_activation_status?: string;
    shop_name?: string | null;
    shop_complete?: boolean;
    verification_status?: string | null;
    total_listings_posted?: number;
}

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    isSeller: boolean;
    loading: boolean;
    refreshAuth: () => Promise<void>;
    setAuthenticatedUser: (user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const pendingOAuthCodes = new Set<string>();

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    // loading stays true until we know for sure whether user is logged in or not
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (
        accessToken: string,
        userId: string,
        userEmail: string,
        userMetadata?: Record<string, unknown>,
        shouldApply: () => boolean = () => true
    ): Promise<boolean> => {
        // Method 1: Try API route
        try {
            const { data } = await fetchJson('/api/auth/me', {
                credentials: 'include',
                cache: 'no-store',
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (data?.success && data?.user) {
                if (!shouldApply()) return false;
                const u = data.user as Partial<User> & { role?: string; seller_status?: string | null; total_listings_posted?: number };
                setUser({
                    id: u.id ?? userId,
                    email: u.email ?? userEmail,
                    name: u.name,
                    username: u.username,
                    role: u.role === 'user' ? 'regular' : (u.role ?? 'regular'),
                    seller_status: u.seller_status ?? null,
                    seller_activation_status: u.seller_activation_status,
                    shop_name: u.shop_name,
                    shop_complete: u.shop_complete,
                    verification_status: u.verification_status ?? null,
                    total_listings_posted: u.total_listings_posted ?? 0,
                });
                return true;
            }
            if (data?.success && data?.user === null) {
                if (shouldApply()) setUser(null);
                return false;
            }
        } catch (_) { /* fall through */ }

        if (!shouldApply()) return false;

        // Keep authenticated UI available while the server profile endpoint recovers.
        const displayName = typeof userMetadata?.full_name === 'string'
            ? userMetadata.full_name
            : typeof userMetadata?.name === 'string'
                ? userMetadata.name
                : userEmail.split('@')[0];

        setUser({
            id: userId,
            email: userEmail,
            name: displayName,
            role: 'regular',
            total_listings_posted: 0,
        });
        return true; // At least we know the user is authenticated
    }, []);

    const refreshAuth = useCallback(async () => {
        try {
            const client = createClient();
            const { data: { session } } = await client.auth.getSession();
            if (!session?.access_token) {
                setUser(null);
                return;
            }
            await fetchProfile(
                session.access_token,
                session.user.id,
                session.user.email ?? '',
                session.user.user_metadata
            );
        } catch (error) {
            console.error('refreshAuth error:', error);
        }
    }, [fetchProfile]);

    useEffect(() => {
      let active = true;
      let generation = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let controller: AbortController | undefined;
      try {
        const client = createClient();
        // Some production auth configurations send the PKCE code to the Site
        // URL instead of the requested /auth/callback URL. Consume it here so
        // the global auth state still becomes signed in on that landing page.
        const currentUrl = new URL(window.location.href);
        const oauthCode = currentUrl.pathname === '/auth/callback'
          ? null
          : currentUrl.searchParams.get('code');
        const shouldExchangeOAuthCode = Boolean(oauthCode && !pendingOAuthCodes.has(oauthCode));
        if (oauthCode && shouldExchangeOAuthCode) {
          setLoading(true);
          pendingOAuthCodes.add(oauthCode);
        }

        // Auth callbacks run under Supabase's session lock. Defer queries and
        // cookie synchronization until that lock has been released.
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          const codeStillPending = oauthCode !== null && pendingOAuthCodes.has(oauthCode);
          if (!session && codeStillPending) return;

          const currentGeneration = ++generation;
          if (timer) clearTimeout(timer);
          controller?.abort();
          if (!session) {
            setUser(null);
            setLoading(false);
          }
          timer = setTimeout(async () => {
            if (!active || currentGeneration !== generation) return;
            controller = new AbortController();
            try {
              if (session) {
                await fetch('/api/auth/sync', {
                  method: 'POST', credentials: 'include', signal: controller.signal,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ access_token: session.access_token, expires_at: session.expires_at }),
                });
              }
            } catch { /* Bearer-authenticated profile requests still work if cookie sync fails. */ }
            if (!active || currentGeneration !== generation || !session) return;
            await fetchProfile(
              session.access_token, session.user.id, session.user.email ?? '',
              session.user.user_metadata, () => active && currentGeneration === generation
            );
            if (active && currentGeneration === generation) setLoading(false);
          }, 0);
        });

        if (oauthCode && shouldExchangeOAuthCode) {
          // The set also prevents React Strict Mode's effect replay from
          // exchanging the same one-time code twice.
          void (async () => {
            try {
              const { data, error } = await client.auth.exchangeCodeForSession(oauthCode);
              const landingUrl = new URL(window.location.href);
              if (landingUrl.searchParams.get('code') === oauthCode) {
                landingUrl.searchParams.delete('code');
                window.history.replaceState(
                  {},
                  document.title,
                  `${landingUrl.pathname}${landingUrl.search}${landingUrl.hash}`,
                );
              }

              if (error || !data.session) {
                console.error('Unable to complete Google sign-in:', error?.message || 'No session returned.');
                return;
              }

              try {
                await fetch('/api/auth/sync', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data.session),
                });
              } catch (syncError) {
                console.warn('Google sign-in succeeded; server session sync will retry:', syncError);
              }

              await refreshAuth();
            } catch (error) {
              console.error('Unable to complete Google sign-in:', error);
            } finally {
              pendingOAuthCodes.delete(oauthCode);
              setLoading(false);
            }
          })();
        }

        // Older Supabase templates can redirect directly to the Site URL with
        // an implicit session in the fragment. Consume signup/recovery sessions
        // here so they work on the current origin, including localhost:3000.
        const callback = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = callback.get('access_token');
        const refreshToken = callback.get('refresh_token');
        const callbackType = callback.get('type');
        if ((callbackType === 'signup' || callbackType === 'recovery') && accessToken && refreshToken) {
          window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
          void client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            .then(({ error }) => {
              if (error) {
                console.error('Unable to restore the Supabase email session:', error.message);
              } else if (callbackType === 'recovery') {
                window.location.replace('/reset-password');
              }
            })
            .catch((error) => console.error('Unable to restore the Supabase email session:', error));
        }

        return () => {
          active = false;
          if (timer) clearTimeout(timer);
          controller?.abort();
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Unable to initialize authentication:', error);
        setUser(null);
        setLoading(false);
      }
    }, [fetchProfile, refreshAuth]);

    useEffect(() => {
        if (!user?.id) return;
        return refreshOnRealtime(['profile'], refreshAuth);
    }, [user?.id, refreshAuth]);

    const isAdmin = user?.role === 'admin';
    const isSeller = user?.role === 'seller' || user?.role === 'admin';

    const setAuthenticatedUser = useCallback((authenticatedUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
        setUser({
            id: authenticatedUser.id,
            email: authenticatedUser.email ?? '',
            name: typeof authenticatedUser.user_metadata?.full_name === 'string'
                ? authenticatedUser.user_metadata.full_name
                : typeof authenticatedUser.user_metadata?.name === 'string'
                    ? authenticatedUser.user_metadata.name
                    : authenticatedUser.email?.split('@')[0],
            role: 'regular',
        });
        setLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAdmin, isSeller, loading, refreshAuth, setAuthenticatedUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
