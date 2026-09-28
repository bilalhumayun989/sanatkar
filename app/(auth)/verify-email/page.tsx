'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchJson } from '@/lib/utils/fetchJson';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const { response: res, data } = await fetchJson(`/api/auth/verify-email?token=${token}`);

                if (res.ok) {
                    setStatus('success');
                    setMessage('Verification successful! You can now log in to your account.');
                    
                    setTimeout(() => {
                        router.push('/login');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed.');
                }
            } catch {
                setStatus('error');
                setMessage('An error occurred during verification.');
            }
        };

        verifyEmail();
    }, [token, router]);

    return (
        <div className="min-h-screen lg:h-screen w-full bg-[#EAEFF9] flex items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-y-auto lg:overflow-hidden font-sans">
            {/* Background Decorator Corner */}
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
                            <Link href="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6">
                                <img
                                    src="/Favicon.png"
                                    alt="Sanatkar Logo"
                                    className="h-7 sm:h-8 w-auto object-contain drop-shadow-sm"
                                />
                                <span className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                                    sanatkar
                                </span>
                            </Link>

                            <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] leading-tight mb-2 tracking-tight">
                                Account Verification
                            </h1>
                            <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">
                                We are verifying your identity to ensure security on the Sanatkar platform.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Dynamic Status Card */}
                    <div className="col-span-1 lg:col-span-7">
                        <div className="bg-[#FAFAFC] rounded-2xl p-6 sm:p-8 shadow-sm border border-white/90 text-center">
                            
                            {status === 'loading' && (
                                <div className="flex flex-col items-center py-4">
                                    <div className="bg-[#13BDC4]/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-[#13BDC4]/20">
                                        <Loader2 className="w-8 h-8 text-[#13BDC4] animate-spin" />
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-[#0F172A] mb-1">Verifying Email</h2>
                                    <p className="text-slate-500 text-xs sm:text-sm">{message}</p>
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="flex flex-col items-center py-2">
                                    <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-[#0F172A] mb-1">Success!</h2>
                                    <p className="text-slate-600 text-xs sm:text-sm mb-4">{message}</p>
                                    <p className="text-[11px] text-slate-400 italic mb-6">Redirecting to login in 3 seconds...</p>
                                    
                                    <Link 
                                        href="/login"
                                        style={{ backgroundColor: '#13BDC4' }}
                                        className="w-full text-white py-2.5 rounded-lg font-semibold text-xs sm:text-sm hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-1.5"
                                    >
                                        <ArrowLeft size={16} /> Go to Login Now
                                    </Link>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="flex flex-col items-center py-2">
                                    <div className="bg-amber-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-amber-500/20">
                                        <XCircle className="w-8 h-8 text-amber-600" />
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-[#0F172A] mb-1">Verification Failed</h2>
                                    <p className="text-slate-600 text-xs sm:text-sm mb-6">{message}</p>
                                    
                                    <Link 
                                        href="/signup"
                                        style={{ backgroundColor: '#13BDC4' }}
                                        className="w-full text-white py-2.5 rounded-lg font-semibold text-xs sm:text-sm hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-1.5 mb-3"
                                    >
                                        Try Signing Up Again
                                    </Link>
                                    
                                    <Link 
                                        href="/login"
                                        className="text-xs text-[#64748B] hover:text-[#0F172A] inline-flex items-center gap-1 font-medium transition-colors"
                                    >
                                        <ArrowLeft size={13} /> Back to Login
                                    </Link>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#EAEFF9] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#13BDC4] animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}