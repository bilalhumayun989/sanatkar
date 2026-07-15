'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { refreshAuth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Invalid credentials');
                setLoading(false);
                return;
            }

            await refreshAuth();
            router.push('/');
        } catch (err: any) {
            setError('Failed to connect to the server.');
            setLoading(false);
        }
    };

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
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden group/card">
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
