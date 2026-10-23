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
        // Auth callbacks run under Supabase's session lock. Defer queries and
        // cookie synchronization until that lock has been released.
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
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
              await fetch(session ? '/api/auth/sync' : '/api/auth/logout', {
                method: 'POST', credentials: 'include', signal: controller.signal,
                ...(session ? {
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ access_token: session.access_token, expires_at: session.expires_at }),
                } : {}),
              });
            } catch { /* Bearer-authenticated profile requests still work if cookie sync fails. */ }
            if (!active || currentGeneration !== generation || !session) return;
            await fetchProfile(
              session.access_token, session.user.id, session.user.email ?? '',
              session.user.user_metadata, () => active && currentGeneration === generation
            );
            if (active && currentGeneration === generation) setLoading(false);
          }, 0);
        });
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
    }, [fetchProfile]);

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
