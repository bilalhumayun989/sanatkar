'use client';

import { createContext, useContext, useState, useEffect } from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAuth = async () => {
        try {
            let attempts = 0;

            while (attempts < 2) {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                const data = await res.json();

                if (data.success && data.user) {
                    setUser(data.user);
                    return;
                }

                if (res.status !== 401 || attempts === 1) {
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
    };

    useEffect(() => {
        refreshAuth();
    }, []);

    const isAdmin = user?.role === 'admin';
    const isSeller = user?.role === 'seller' || user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, isAdmin, isSeller, loading, refreshAuth }}>
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
