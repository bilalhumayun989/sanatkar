'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Allow shorthand 'admin' to resolve to the real admin email
            const loginEmail = username.trim() === 'admin' ? 'admin@SANATkar.com' : username.trim();

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Invalid credentials');
            if (data.user?.role !== 'admin') throw new Error('Access denied: Admin only');

            // Store minimal flag for page-level auth check
            sessionStorage.setItem('adminAuth', 'true');
            router.push('/admin/dashboard');
        } catch (err: any) {
            setError(err.message || 'Invalid credentials. Access denied.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[150px] pointer-events-none opacity-40"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-center opacity-[0.02] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10 fade-in-up">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 mb-8 group cursor-default">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <span className="text-4xl font-black text-primary tracking-tighter relative drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">SANAT</span>
                            <span className="text-4xl font-black text-white tracking-tighter relative drop-shadow-md">KAR</span>
                        </div>
                    </div>

                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 bg-primary/20 rounded-2xl rotate-6 animate-pulse"></div>
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/10">
                            <Shield className="text-primary w-8 h-8" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white! mb-2">System Access</h1>
                    <p className="text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Secure Area — Authorized Personnel Only
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden group/card">
                    {/* Inner glowing border effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    <form onSubmit={handleLogin} className="space-y-6 relative">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-300 ml-1">Admin ID</label>
                            <div className="relative group/input">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/0 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-300 blur-sm pointer-events-none"></div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter identifier"
                                    required
                                    className="relative w-full px-5 py-4 rounded-xl bg-[#131b2f]/80 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:bg-[#131b2f] focus:outline-none text-sm transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-300 ml-1">Security Key</label>
                            <div className="relative group/input">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/0 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-300 blur-sm pointer-events-none"></div>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    className="relative w-full px-5 py-4 rounded-xl bg-[#131b2f]/80 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:bg-[#131b2f] focus:outline-none text-sm pr-12 transition-all shadow-inner tracking-widest"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="animate-in slide-in-from-top-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl px-4 py-3.5 flex items-center gap-3">
                                <Shield className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-dark transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 group mt-8"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Initialize Session
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-center text-xs font-medium text-gray-500">
                            Demo Credentials: <span className="font-mono text-gray-300 bg-white/5 px-2 py-0.5 rounded ml-1">admin</span> / <span className="font-mono text-gray-300 bg-white/5 px-2 py-0.5 rounded">admin123</span>
                        </p>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-widest">
                        SANATKAR Command Center v2.0
                    </p>
                </div>
            </div>
        </div>
    );
}
