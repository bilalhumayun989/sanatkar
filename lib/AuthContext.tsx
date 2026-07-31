'use client';

import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { fetchJson } from '@/lib/fetchJson';
import { createClient } from '@/lib/supabase/client';

interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
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
    const [loading, setLoading] = useState(true);

    const refreshAuth = useCallback(async () => {
        try {
            let attempts = 0;
            const client = createClient();

            while (attempts < 2) {
                const { data: { session } } = await client.auth.getSession();
                const { response: res, data } = await fetchJson('/api/auth/me', {
                    credentials: 'include',
                    headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
                });

                if (data.success && data.user) {
                    setUser(data.user);
                    return;
                }

                if (res.status !== 401 || attempts === 1) {
                    // OAuth writes the session in the browser first. During the
                    // redirect, the server can occasionally read the request
                    // before that cookie is visible. Keep the signed-in UI in
                    // sync with the confirmed browser session in that case.
                    const { data: { session } } = await client.auth.getSession();
                    if (session?.user) {
                        setUser({
                            id: session.user.id,
                            email: session.user.email ?? '',
                            name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name,
                            role: 'user',
                        });
                        return;
                    }
                    setUser(null);
                    return;
                }

                attempts += 1;
                await new Promise((resolve) => setTimeout(resolve, 250));
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);

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
            role: 'user',
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
