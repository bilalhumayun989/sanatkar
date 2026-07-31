'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { fetchJson } from '@/lib/fetchJson';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const { refreshAuth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [oauthProcessing, setOauthProcessing] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { response: res, data } = await fetchJson('/api/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }),
            });
            if (!res.ok) {
                setError(data.message || 'Invalid email or password');
                setLoading(false);
                return;
            }

            const session = (data as { session?: { access_token?: string; refresh_token?: string } } | undefined)?.session;
            if (session?.access_token && session?.refresh_token) {
                const supabase = createClient();
                await supabase.auth.setSession({
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                });
            }

            await refreshAuth();
            // honor optional `next` query param so we return users to their target
            try {
                const next = new URL(window.location.href).searchParams.get('next');
                router.replace(next || '/');
            } catch {
                router.replace('/');
            }
        } catch (err: any) {
            setError('Failed to connect to the server.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setGoogleLoading(true);

        try {
            const supabase = createClient();
            const origin = window.location.origin;
            const next = new URL(window.location.href).searchParams.get('next');
            const redirectTo = next ? `${origin}/auth/callback?next=${encodeURIComponent(next)}` : `${origin}/auth/callback`;

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo },
            });

            if (error) throw error;
            if (data?.url) {
                window.location.assign(data.url);
                return;
            }

            setError('Unable to start Google sign-in.');
        } catch (err: any) {
            setError(err.message || 'Unable to continue with Google.');
        } finally {
            setGoogleLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!window.location.hash.includes('access_token') && !window.location.hash.includes('error')) return;
        if (oauthProcessing) return;

        const processOAuthHash = async () => {
            setOauthProcessing(true);
            setError('');
            setLoading(true);

            const supabase = createClient();
            const hash = window.location.hash;
            const parsed = hash ? Object.fromEntries(new URLSearchParams(hash.slice(1)).entries()) : {};

            if (parsed.access_token && parsed.refresh_token) {
                const sessionData = {
                    access_token: parsed.access_token,
                    refresh_token: parsed.refresh_token,
                    expires_in: parsed.expires_in ? Number(parsed.expires_in) : undefined,
                    token_type: parsed.token_type,
                    provider_token: parsed.provider_token,
                };

                const { data: setData, error: sessionSetError } = await supabase.auth.setSession(sessionData as any);
                if (sessionSetError) {
                    setError(sessionSetError.message || 'Unable to store Google session.');
                    setLoading(false);
                    setOauthProcessing(false);
                    return;
                }
                if (setData?.session) {
                        try {
                            await fetch('/api/auth/sync', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(setData.session) });
                        } catch (e) {}

                        await refreshAuth();
                        window.history.replaceState({}, document.title, window.location.pathname);
                        try { const next = new URL(window.location.href).searchParams.get('next'); router.replace(next || '/'); } catch { router.replace('/'); }
                    return;
                }
            }

            const { data, error } = await supabase.auth.getSession();
            if (error) {
                setError(error.message || 'Google sign-in failed.');
                setLoading(false);
                setOauthProcessing(false);
                return;
            }

            if (data?.session) {
                    try {
                        await fetch('/api/auth/sync', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data.session) });
                    } catch (e) {}

                    await refreshAuth();
                    window.history.replaceState({}, document.title, window.location.pathname);
                    try { const next = new URL(window.location.href).searchParams.get('next'); router.replace(next || '/'); } catch { router.replace('/'); }
                return;
            }

            setError('Unable to complete Google sign-in.');
            setLoading(false);
            setOauthProcessing(false);
        };

        processOAuthHash();
    }, [router, refreshAuth, oauthProcessing]);

    return (
        <div className="min-h-screen bg-[#000] flex items-center justify-center px-4 relative overflow-hidden pt-20">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-black rounded-full blur-[120px] pointer-events-none opacity-60"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none opacity-40"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-center opacity-[0.02] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10 fade-in-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group transition-transform active:scale-95">
                       
                       <div className="flex items-center">
  <img
    src="/logo.png"
    alt="Sanatkar Logo"
    className="h-10 w-auto object-contain"
  />
</div>
                    </Link>

                    <h1 className="text-3xl font-bold text-white! mb-2">Welcome Back</h1>
                    <p className="text-gray-400 text-sm font-medium">
                        Log in to manage your industrial inventory
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 mb-10  shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden group/card">
                    {/* Inner glowing border effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    <form onSubmit={handleLogin} className="space-y-6 relative">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-300 ml-1">Email Address</label>
                            <div className="relative group/input">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/0 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-300 blur-sm pointer-events-none"></div>
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                    className="relative w-full pl-12 pr-5 py-4 rounded-xl bg-[#131b2f]/80 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:bg-[#131b2f] focus:outline-none text-sm transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-300 ml-1">Password</label>
                            <div className="relative group/input">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/0 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-300 blur-sm pointer-events-none"></div>
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="relative w-full pl-12 pr-5 py-4 rounded-xl bg-[#131b2f]/80 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:bg-[#131b2f] focus:outline-none text-sm transition-all shadow-inner tracking-widest"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end -mt-4">
                            <Link 
                                href="/forgot-password" 
                                className="text-sm text-primary font-medium hover:underline transition-all"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {error && (
                            <div className="animate-in slide-in-from-top-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-dark transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 group mt-8"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative flex items-center justify-center my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <span className="relative bg-[#060816] px-3 text-xs uppercase tracking-[0.25em] text-gray-500">Or</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading || loading}
                            className="w-full border border-white/10 bg-white/5 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {googleLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <span className="text-base font-bold">G</span>
                                    Continue with Google
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-3">
                        <p className="text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-primary font-bold hover:underline">
                                Sign up
                            </Link>
                        </p>
                        <p className="text-xs text-gray-500">
                            Professional trader?{' '}
                            <Link href="/seller/signup" className="text-gray-400 hover:text-white transition-colors underline">
                                Register as a Seller
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
