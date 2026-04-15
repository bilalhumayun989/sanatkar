'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Mail, Lock, User, Loader2, ArrowRight, ExternalLink, Globe, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function SignupPage() {
    const router = useRouter();
    const { refreshAuth } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'user' | 'seller'>('user');
    const [pakwheelsUrl, setPakwheelsUrl] = useState('');
    const [darazUrl, setDarazUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    password, 
                    role,
                    ...(role === 'seller' && { pakwheelsUrl, darazUrl }) 
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Something went wrong');
                setLoading(false);
                return;
            }

            // Successfully registered, show success status
            setLoading(false);
            setSuccess(true);
            setMessage(data.message || 'Check your email to verify your account.');
        } catch (err: any) {
            setError('Failed to connect to the server.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center px-4 relative overflow-hidden pt-20">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[150px] pointer-events-none opacity-40"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-center opacity-[0.02] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10 fade-in-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group transition-transform active:scale-95">
                        <div className="bg-primary p-2.5 rounded-2xl group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-primary/20">
                            <Package size={26} className="text-white" />
                        </div>
                        <div className="flex flex-col leading-tight text-left">
                            <span className="text-xl font-black tracking-tighter text-white uppercase italic">SANAT<span className="text-primary">KAR</span></span>
                        </div>
                    </Link>

                    <h1 className="text-3xl font-bold text-white! mb-2">Create an Account</h1>
                    <p className="text-gray-400 text-sm font-medium">
                        Join us to trade premium embroidery machine parts
                    </p>
                </div>

                {/* Signup Card */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden group/card">
                    {/* Inner glowing border effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    {success ? (
                        <div className="text-center py-8">
                            <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="text-primary w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Check your email</h2>
                            <p className="text-gray-400 mb-8">{message}</p>
                            <Link 
                                href="/login"
                                className="w-full bg-primary text-white py-4 px-8 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-dark transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] block"
                            >
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSignup} className="space-y-4 relative">
                            {/* Role Selection Tabs */}
                            <div className="flex p-1 bg-[#131b2f] rounded-2xl mb-6">
                                <button
                                    type="button"
                                    onClick={() => setRole('user')}
                                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                                        role === 'user' 
                                            ? 'bg-primary text-white shadow-lg' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    Regular User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('seller')}
                                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                                        role === 'seller' 
                                            ? 'bg-secondary text-white shadow-lg' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    Professional Seller
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-300 ml-1">
                                    {role === 'seller' ? 'Business / Full Name' : 'Full Name'}
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/0 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-300 blur-sm pointer-events-none"></div>
                                    {role === 'seller' ? 
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" /> :
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                                    }
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={role === 'seller' ? "Sajid Industrial Solutions" : "John Doe"}
                                        required
                                        className="relative w-full pl-12 pr-5 py-3.5 rounded-xl bg-[#131b2f]/80 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:bg-[#131b2f] focus:outline-none text-sm transition-all shadow-inner"
                                    />
                                </div>
                            </div>

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
                                        className="relative w-full pl-12 pr-5 py-3.5 rounded-xl bg-[#131b2f]/80 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:bg-[#131b2f] focus:outline-none text-sm transition-all shadow-inner"
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
                                        minLength={6}
                                        className="relative w-full pl-12 pr-5 py-3.5 rounded-xl bg-[#131b2f]/80 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:bg-[#131b2f] focus:outline-none text-sm transition-all shadow-inner tracking-widest"
                                    />
                                </div>
                            </div>

                            {/* Conditional Seller Fields */}
                            {role === 'seller' && (
                                <div className="pt-2 animate-in slide-in-from-top-4 fade-in duration-500">
                                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 ml-1">Store Presence</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-medium text-gray-400 ml-1">PakWheels Profile URL</label>
                                            <div className="relative group/input">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-blue-500/0 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-300 blur-sm pointer-events-none"></div>
                                                <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                                                <input
                                                    type="url"
                                                    value={pakwheelsUrl}
                                                    onChange={(e) => setPakwheelsUrl(e.target.value)}
                                                    placeholder="https://www.pakwheels.com/user/..."
                                                    className="relative w-full pl-12 pr-5 py-3.5 rounded-xl bg-[#131b2f]/80 backdrop-blur-md border border-white/10 text-white placeholder-gray-600 focus:border-blue-500/50 focus:bg-[#131b2f] focus:outline-none text-sm transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-medium text-gray-400 ml-1">Daraz Store URL</label>
                                            <div className="relative group/input">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/30 to-orange-500/0 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-300 blur-sm pointer-events-none"></div>
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                                                <input
                                                    type="url"
                                                    value={darazUrl}
                                                    onChange={(e) => setDarazUrl(e.target.value)}
                                                    placeholder="https://www.daraz.pk/shop/..."
                                                    className="relative w-full pl-12 pr-5 py-3.5 rounded-xl bg-[#131b2f]/80 backdrop-blur-md border border-white/10 text-white placeholder-gray-600 focus:border-orange-500/50 focus:bg-[#131b2f] focus:outline-none text-sm transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="animate-in slide-in-from-top-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-3">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-dark transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 group mt-6"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Sign Up
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-3">
                        <p className="text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary font-bold hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
