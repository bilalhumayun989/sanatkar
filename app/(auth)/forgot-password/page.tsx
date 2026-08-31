'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchJson } from '@/lib/utils/fetchJson';

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
        } catch {
            setStatus('error');
            setMessage('Failed to connect to the server.');
        }
    };

    return (
        <div className="min-h-screen lg:h-screen w-full bg-[#EAEFF9] flex items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-y-auto lg:overflow-hidden font-sans">
            {/* Background Decorator Corner (Matches Login / Signup) */}
            <div
                className="absolute top-0 left-0 w-48 h-40 sm:w-64 sm:h-56 lg:w-80 lg:h-72
                bg-blue-500/20
                backdrop-blur-3xl
                border-r border-b border-blue-300/30
                shadow-[0_8px_40px_rgba(30,64,15,0.25)]
                pointer-events-none"
                style={{ borderRadius: '0% 0% 100% 0%' }}
            />

            {/* Main Outer Container */}
            <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-4 sm:p-6 lg:p-8 flex flex-col justify-between relative z-10 border border-white/60 bg-gradient-to-r from-[#FFFFFF] via-[#E4EFFF] to-[#AECBFF] my-auto"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10">
                    
                    {/* LEFT SIDE: Brand & Header Info */}
                    <div className="col-span-1 lg:col-span-5 flex flex-col justify-between h-full text-left">
                        <div>
                            {/* Logo */}
                            <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
                                <img
                                    src="/Favicon.png"
                                    alt="Sanatkar Logo"
                                    className="h-7 sm:h-8 w-auto object-contain drop-shadow-sm"
                                />
                                <span className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                                    sanatkar
                                </span>
                            </div>

                            <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] leading-tight mb-2 tracking-tight">
                                Password Recovery
                            </h1>
                            <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">
                                Enter your registered account email. We will send you a verification link to set a new password.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Interactive Form Container */}
                    <div className="col-span-1 lg:col-span-7">
                        <div className="bg-[#FAFAFC] rounded-2xl p-4 sm:p-6 shadow-sm border border-white/90">
                            
                            <AnimatePresence mode="wait">
                                {status === 'success' ? (
                                    <motion.div 
                                        key="success-card"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="text-center py-6"
                                    >
                                        <div className="bg-[#13BDC4]/10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#13BDC4]/20">
                                            <Send className="text-[#13BDC4] w-7 h-7" />
                                        </div>
                                        <h2 className="text-base sm:text-lg font-bold text-[#0F172A] mb-1.5">Check Your Email</h2>
                                        <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-sm mx-auto">{message}</p>
                                        <Link 
                                            href="/login"
                                            className="inline-flex items-center gap-2 text-[#13BDC4] text-xs sm:text-sm font-semibold hover:underline"
                                        >
                                            <ArrowLeft size={16} /> Back to Sign In
                                        </Link>
                                    </motion.div>
                                ) : (
                                    <motion.form 
                                        key="form-card"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onSubmit={handleSubmit} 
                                        className="space-y-4 text-left"
                                    >
                                        <div className="mb-2">
                                            <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                                                Reset Password
                                            </h2>
                                            <p className="text-[11px] text-[#94A3B8]">Provide your email address below</p>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-semibold text-[#334155]">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="you@example.com"
                                                    className="w-full pl-9 pr-3 py-1.5 sm:py-2 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-xs focus:bg-white focus:outline-none focus:border-[#13BDC4] transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {status === 'error' && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -4 }} 
                                                animate={{ opacity: 1, y: 0 }} 
                                                className="bg-red-50 border border-red-200 text-red-600 text-[11px] rounded-lg px-3 py-1.5"
                                            >
                                                {message}
                                            </motion.div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={status === 'loading'}
                                            style={{ backgroundColor: '#13BDC4' }}
                                            className="w-full text-white py-2 rounded-lg font-semibold text-xs sm:text-sm hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-1.5 mt-2 disabled:opacity-70 active:scale-[0.99]"
                                        >
                                            {status === 'loading' ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Sending link…
                                                </>
                                            ) : (
                                                <>
                                                    Send Reset Link
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>

                                        <div className="mt-3 text-center pt-1">
                                            <Link 
                                                href="/login" 
                                                className="text-xs text-[#64748B] hover:text-[#0F172A] inline-flex items-center gap-1 font-medium transition-colors"
                                            >
                                                <ArrowLeft size={13} /> Return to Login
                                            </Link>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}