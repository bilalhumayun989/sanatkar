'use client';

import { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/utils/fetchJson';
import { createClient } from '@/lib/auth/supabase/client';

interface User {
    id: string;
    email: string;
    name?: string;
    username?: string;
    role: string;
    seller_status?: string | null;
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
    const pathname = usePathname();
    const router = useRouter();

    const fetchProfile = useCallback(async (
        accessToken: string,
        userId: string,
        userEmail: string,
        userMetadata?: Record<string, unknown>
    ): Promise<boolean> => {
        // Method 1: Try API route
        try {
            const { data } = await fetchJson('/api/auth/me', {
                credentials: 'include',
                cache: 'no-store',
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (data?.success && data?.user) {
                const u = data.user as Partial<User> & { role?: string; seller_status?: string | null; total_listings_posted?: number };
                setUser({
                    id: u.id ?? userId,
                    email: u.email ?? userEmail,
                    name: u.name,
                    username: u.username,
                    role: u.role === 'user' ? 'regular' : (u.role ?? 'regular'),
                    seller_status: u.seller_status ?? null,
                    verification_status: u.verification_status ?? null,
                    total_listings_posted: u.total_listings_posted ?? 0,
                });
                return true;
            }
        } catch (_) { /* fall through */ }

        // Method 2: Direct Supabase client
        try {
            const client = createClient();
            const { data: profileData, error } = await client
                .from('profiles')
                .select('id, username, role, seller_status, verification_status, total_listings_posted')
                .eq('id', userId)
                .maybeSingle();

            if (!error && profileData) {
                setUser({
                    id: profileData.id,
                    email: userEmail,
                    name: profileData.username ?? undefined,
                    username: profileData.username ?? undefined,
                    role: profileData.role ?? 'regular',
                    seller_status: profileData.seller_status ?? null,
                    verification_status: profileData.verification_status ?? null,
                    total_listings_posted: profileData.total_listings_posted ?? 0,
                });
                return true;
            }
        } catch (_) { /* fall through */ }

        // Method 3: Use session data as fallback (better than redirecting to login)
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
        const client = createClient();

        // onAuthStateChange is the single source of truth
        const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                setUser(null);
                setLoading(false);
                return;
            }

            if (session?.access_token) {
                await fetchProfile(
                    session.access_token,
                    session.user.id,
                    session.user.email ?? '',
                    session.user.user_metadata
                );
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

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
