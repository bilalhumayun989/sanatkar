'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { fetchJson } from '@/lib/utils/fetchJson';
import { createClient } from '@/lib/auth/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';

// Online Image Flag Components
const USFlag = () => (
    <img
        src="https://flagcdn.com/w40/us.png"
        alt="USA Flag"
        className="w-5 h-5 rounded-full object-cover shrink-0 shadow-sm border border-slate-200"
    />
);

const PKFlag = () => (
    <img
        src="https://flagcdn.com/w40/pk.png"
        alt="Pakistan Flag"
        className="w-5 h-5 rounded-full object-cover shrink-0 shadow-sm border border-slate-200"
    />
);

// Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96, y: 12 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1] as const, // <-- Added 'as const'
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }, // <-- Added 'as const'
    },
};


const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -6 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.2, ease: 'easeOut' },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: -6,
        transition: { duration: 0.15, ease: 'easeIn' },
    },
};

export default function LoginPage() {
    const router = useRouter();
    const { refreshAuth } = useAuth();
    const { language, toggleLanguage } = useLanguage();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [oauthProcessing, setOauthProcessing] = useState(false);

    // Dropdown state and ref for outside click detection
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageSelect = (selectedLang: string) => {
        if (language !== selectedLang) {
            toggleLanguage();
        }
        setLangDropdownOpen(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const { response: res, data } = await fetchJson('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                setError(data.message || 'Invalid email or password');
                setLoading(false);
                return;
            }

            const session = (data as { session?: { access_token?: string; refresh_token?: string } } | undefined)?.session;
            if (session?.access_token && session?.refresh_token) {
                try {
                    const supabase = createClient();
                    const sessionController = new AbortController();
                    const sessionTimeoutId = setTimeout(() => sessionController.abort(), 5000);

                    await supabase.auth.setSession({
                        access_token: session.access_token,
                        refresh_token: session.refresh_token,
                    });

                    clearTimeout(sessionTimeoutId);
                } catch (sessionError) {
                    console.warn('Supabase session setting failed, but login API succeeded:', sessionError);
                }
            }

            await refreshAuth();
            try {
                const next = new URL(window.location.href).searchParams.get('next');
                router.replace(next || '/');
            } catch {
                router.replace('/');
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setError('Login request timed out. Please check your connection and try again.');
            } else {
                setError('Failed to connect to the server.');
            }
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

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    queryParams: { prompt: 'select_account' },
                },
            });

            clearTimeout(timeoutId);

            if (error) throw error;
            if (data?.url) {
                window.location.assign(data.url);
                return;
            }

            setError('Unable to start Google sign-in.');
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setError('Google sign-in timed out. Please check your connection and try again.');
            } else {
                setError(err.message || 'Unable to continue with Google.');
            }
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
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);
                        await fetch('/api/auth/sync', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(setData.session),
                            signal: controller.signal,
                        });
                        clearTimeout(timeoutId);
                    } catch (e) {
                        console.warn('Auth sync failed but continuing with login:', e);
                    }

                    await refreshAuth();
                    window.history.replaceState({}, document.title, window.location.pathname);
                    try {
                        const next = new URL(window.location.href).searchParams.get('next');
                        router.replace(next || '/');
                    } catch {
                        router.replace('/');
                    }
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
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    await fetch('/api/auth/sync', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data.session),
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);
                } catch (e) {
                    console.warn('Auth sync failed but continuing with login:', e);
                }

                await refreshAuth();
                window.history.replaceState({}, document.title, window.location.pathname);
                try {
                    const next = new URL(window.location.href).searchParams.get('next');
                    router.replace(next || '/');
                } catch {
                    router.replace('/');
                }
                return;
            }

            setError('Unable to complete Google sign-in.');
            setLoading(false);
            setOauthProcessing(false);
        };

        processOAuthHash();
    }, [router, refreshAuth, oauthProcessing]);

    return (
        <div className="min-h-screen lg:h-screen bg-[#EAEFF9] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto lg:overflow-hidden font-sans">
            {/* Ambient Background Glow Effect */}
            <motion.div
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute top-0 left-0 w-48 h-40 sm:w-64 sm:h-56 lg:w-80 lg:h-72 bg-blue-500/20 backdrop-blur-3xl border-r border-b border-blue-300/30 shadow-[0_8px_40px_rgba(30,64,15,0.25)] pointer-events-none"
                style={{ borderRadius: '0% 0% 100% 0%' }}
            />

            {/* Main Outer Card Container with Staggered Entrance */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-5xl rounded-[24px] lg:rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.06)] p-5 sm:p-8 lg:p-12 my-6 lg:my-0 lg:min-h-[580px] lg:max-h-[90vh] flex flex-col justify-between relative z-10 border border-white/60 bg-gradient-to-r from-[#FFFFFF] via-[#E4EFFF] to-[#AECBFF]"
            >
                {/* Logo Positioned Top-Left */}
                <motion.div variants={itemVariants}>
                    <div className="static sm:absolute sm:top-8 sm:left-10 z-20 flex items-center gap-2.5 mb-4 sm:mb-0">
                        <img
                            src="/Favicon.png"
                            alt="Sanatkar Logo"
                            className="h-7 sm:h-8 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
                        />
                        <span className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight -mt-0.5">
                            sanatkar
                        </span>
                    </div>
                </motion.div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10 my-auto pt-2 sm:pt-6 lg:pt-4">
                    {/* Left Hero Section */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-6 flex flex-col justify-center h-full pr-0 lg:pr-6 text-center lg:text-left mt-0 sm:mt-0 md:mt-5 lg:mt-0"
                    >
                        <h1 className="text-2xl sm:text-3xl lg:text-[26px] font-bold text-[#1E293B] leading-tight mb-3 tracking-tight">
                            Pakistan's Trusted Industrial Marketplace
                        </h1>
                        <p className="text-[#64748B] text-xs sm:text-sm max-w-md leading-relaxed mx-auto lg:mx-0">
                            Buy and sell machines, spare parts, and equipment with verified sellers across the country.
                        </p>
                    </motion.div>

                    {/* Right Form Card */}
                    <motion.div variants={itemVariants} className="lg:col-span-6">
                        <div className="bg-[#FAFAFC] rounded-[20px] lg:rounded-[24px] p-4 sm:p-6 lg:p-9 shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-white/90">
                            <div className="mb-5">
                                <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Log In</h2>
                                <p className="text-xs text-[#94A3B8] mt-1 font-normal">Manage your account</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-[#334155]">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-sm focus:bg-white focus:outline-none focus:border-[#13BDC4] focus:ring-1 focus:ring-[#13BDC4] transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-semibold text-[#334155]">Password</label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs font-medium text-[#13BDC4] hover:underline transition-all"
                                        >
                                            Forgot Password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full px-4 py-2.5 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-sm focus:bg-white focus:outline-none focus:border-[#13BDC4] focus:ring-1 focus:ring-[#13BDC4] transition-all pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: -6, height: 0 }}
                                            className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 overflow-hidden"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="pt-1">
                                    <div className="relative flex items-center justify-center mb-3">
                                        <div className="w-full border-t border-gray-200" />
                                        <span className="absolute bg-[#FAFAFC] px-3 text-[11px] text-gray-400 font-medium">Or with</span>
                                    </div>

                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleGoogleLogin}
                                        disabled={googleLoading || loading}
                                        className="w-full border border-[#E2E8F0] bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
                                    >
                                        {googleLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                                </svg>
                                                <span>Log in with Google</span>
                                            </>
                                        )}
                                    </motion.button>
                                </div>

                                <motion.button
                                    type="submit"
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading}
                                    style={{ backgroundColor: '#13BDC4' }}
                                    className="w-full text-white py-2.5 rounded-lg font-semibold text-sm hover:opacity-95 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-3"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        'Log In'
                                    )}
                                </motion.button>
                            </form>

                            <div className="mt-5 text-center">
                                <p className="text-xs text-[#64748B]">
                                    Don't have an account?{' '}
                                    <Link href="/signup" style={{ color: '#13BDC4' }} className="font-semibold hover:underline">
                                        Sign up
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Bar */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap items-center justify-center sm:justify-between md:justify-between lg:justify-start gap-3 sm:gap-26 relative z-20 pt-5 lg:pt-0"
                    ref={dropdownRef}
                >
                    {/* Animated Language Dropdown */}
                    <div className="relative inline-block text-left">
                        <button
                            type="button"
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-semibold text-[#1E293B] hover:bg-black/5 transition-colors focus:outline-none"
                        >
                            {language === 'en' ? <USFlag /> : <PKFlag />}
                            <span>{language === 'en' ? 'English' : 'اردو'}</span>
                            <ChevronDown
                                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                                    langDropdownOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        <AnimatePresence>
                            {langDropdownOpen && (
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="absolute bottom-full left-0 mb-2 w-36 rounded-xl bg-white shadow-xl border border-slate-100 py-1 z-50 origin-bottom-left overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleLanguageSelect('en')}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                            language === 'en' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <USFlag />
                                        <span>English</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleLanguageSelect('ur')}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                            language === 'ur' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <PKFlag />
                                        <span>اردو</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Inline Links */}
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs font-semibold text-[#2563EB]">
                        <Link href="/terms" className="hover:underline transition-all">
                            Terms
                        </Link>
                        <Link href="/plans" className="hover:underline transition-all">
                            Plans
                        </Link>
                        <Link href="/contact" className="hover:underline transition-all">
                            Contact Us
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}