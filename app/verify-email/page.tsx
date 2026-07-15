'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';

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
                const res = await fetch(`/api/auth/verify-email?token=${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage('Verification successful! You can now login.');
                    
                    // Redirect after 3 seconds
                    setTimeout(() => {
                        router.push('/login');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred during verification.');
            }
        };

        verifyEmail();
    }, [token, router]);

    return (
        <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[150px] pointer-events-none opacity-40"></div>

            <div className="w-full max-w-md relative z-10 text-center">
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
                    
                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                            <h1 className="text-2xl font-bold text-white mb-2">Verifying Email</h1>
                            <p className="text-gray-400">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
                            <h1 className="text-2xl font-bold text-white mb-2">Success!</h1>
                            <p className="text-gray-400 mb-6">{message}</p>
                            <p className="text-sm text-gray-500 italic">Redirecting to login in 3 seconds...</p>
                            <Link 
                                href="/login"
                                className="mt-8 text-primary font-bold hover:underline flex items-center gap-2"
                            >
                                <ArrowLeft size={16} /> Go to Login now
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <XCircle className="w-16 h-16 text-amber-500 mb-6" />
                            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
                            <p className="text-gray-400 mb-8">{message}</p>
                            <Link 
                                href="/signup"
                                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-dark transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                            >
                                Try Signing Up Again
                            </Link>
                            <Link 
                                href="/login"
                                className="mt-6 text-gray-400 text-sm hover:text-white transition-colors"
                            >
                                Back to Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
