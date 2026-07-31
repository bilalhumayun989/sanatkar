'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { fetchJson } from '@/lib/fetchJson';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const { response: res, data } = await fetchJson('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus('success');
                setMessage(data.message ?? 'Email sent successfully');
            } else {
                setStatus('error');
                setMessage(data.message || 'Something went wrong');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Failed to connect to the server.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center px-4 relative overflow-hidden pt-20">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[150px] pointer-events-none opacity-40"></div>

            <div className="w-full max-w-md relative z-10 fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
                    <p className="text-gray-400 text-sm font-medium">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
                    
                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Send className="text-green-500 w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-4">Email Sent!</h2>
                            <p className="text-gray-400 mb-8">{message}</p>
                            <Link 
                                href="/login"
                                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                            >
                                <ArrowLeft size={16} /> Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            {status === 'error' && (
                                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium rounded-xl px-4 py-3">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-dark transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : (
                                    <>
                                        Send Reset Link
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-4">
                                <Link 
                                    href="/login"
                                    className="text-gray-400 text-sm hover:text-white transition-colors inline-flex items-center gap-2"
                                >
                                    <ArrowLeft size={14} /> Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
