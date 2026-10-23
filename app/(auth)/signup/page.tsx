'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, ChevronDown, User, Store, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchJson } from '@/lib/utils/fetchJson';
import { createClient } from '@/lib/auth/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';

type AccountType = 'user' | 'seller';

const USFlag = () => (
  <img
    src="https://flagcdn.com/w40/us.png"
    alt="USA Flag"
    className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm border border-slate-200"
  />
);

const PKFlag = () => (
  <img
    src="https://flagcdn.com/w40/pk.png"
    alt="Pakistan Flag"
    className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm border border-slate-200"
  />
);

export default function SignupPage() {
  const { language, toggleLanguage } = useLanguage();

  const [accountType, setAccountType] = useState<AccountType>('user');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { response, data } = await fetchJson('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          phone,
          fullName: accountType === 'seller' ? fullName : undefined,
          cnic: accountType === 'seller' ? cnic : undefined,
          accountType,
        }),
      });

      if (!response.ok) {
        setError(data.message || 'Unable to create account.');
      } else {
        setMessage(data.message || 'Verification request accepted. Check your inbox and spam folder. If no email arrives, use Resend on the login screen or contact support.');
      }
    } catch {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setMessage('');
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const next = accountType === 'seller' ? '/become-seller' : new URL(window.location.href).searchParams.get('next');
      const redirectTo = next ? `${origin}/auth/callback?next=${encodeURIComponent(next)}` : `${origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { prompt: 'select_account' },
        },
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

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#EAEFF9] flex items-center justify-center p-2 sm:p-4 lg:p-6 relative overflow-y-auto lg:overflow-hidden font-sans">
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

      {/* Main Container with Entrance Animation */}
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-5xl lg:max-h-[96vh] rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-4 sm:p-6 lg:p-8 flex flex-col justify-between relative z-10 border border-white/60 bg-gradient-to-r from-[#FFFFFF] via-[#E4EFFF] to-[#AECBFF] my-4 lg:my-auto lg:overflow-hidden"
      >
        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10 my-auto lg:overflow-hidden">

          {/* LEFT SIDE: Logo & Account Selection */}
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

              <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] leading-tight mb-1 tracking-tight">
                Create Account
              </h1>
              <p className="text-[#64748B] text-xs sm:text-sm mb-4">
                Select how you want to use the platform to continue.
              </p>

              {/* Account Type Option Cards */}
              <div className="space-y-2.5">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setAccountType('user')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 relative ${accountType === 'user'
                      ? 'bg-white border-[#13BDC4] shadow-md ring-1 ring-[#13BDC4]'
                      : 'bg-white/50 border-slate-200 hover:bg-white/80'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${accountType === 'user' ? 'bg-[#13BDC4]/10 text-[#13BDC4]' : 'bg-slate-100 text-slate-500'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-semibold text-[#0F172A]">Regular User</h3>
                      {accountType === 'user' && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle2 className="w-4 h-4 text-[#13BDC4]" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Browse products, place orders, and manage purchases.</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setAccountType('seller')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 relative ${accountType === 'seller'
                      ? 'bg-white border-[#13BDC4] shadow-md ring-1 ring-[#13BDC4]'
                      : 'bg-white/50 border-slate-200 hover:bg-white/80'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${accountType === 'seller' ? 'bg-[#13BDC4]/10 text-[#13BDC4]' : 'bg-slate-100 text-slate-500'}`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-semibold text-[#0F172A]">Professional Seller</h3>
                      {accountType === 'seller' && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle2 className="w-4 h-4 text-[#13BDC4]" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">List machinery, open shop, and manage industrial sales.</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Dynamic Input Form */}
          <div className="col-span-1 lg:col-span-7 lg:overflow-hidden">
            <div className="bg-[#FAFAFC] rounded-2xl p-4 sm:p-6 shadow-sm border border-white/90 max-h-[60vh] sm:max-h-[70vh] lg:min-h-[75vh] lg:max-h-[80vh] overflow-y-auto custom-scrollbar">

              <div className="mb-3">
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  {accountType === 'seller' ? 'Seller Verification Details' : 'User Account Details'}
                </h2>
                <p className="text-[11px] text-[#94A3B8]">Fill in your registration credentials below</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-2.5 text-left">
                <AnimatePresence mode="wait">
                  {accountType === 'seller' ? (
                    <motion.div
                      key="seller-fields"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-[#334155]">Username</label>
                          <input
                            type="text"
                            required
                            minLength={3}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-xs focus:bg-white focus:outline-none focus:border-[#13BDC4] transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-[#334155]">Full Name</label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-xs focus:bg-white focus:outline-none focus:border-[#13BDC4] transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#334155]">Email Address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-xs focus:bg-white focus:outline-none focus:border-[#13BDC4] transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-[#334155]">Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="03XX XXXXXXX"
                            className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-xs focus:bg-white focus:outline-none focus:border-[#13BDC4] transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-[#334155]">CNIC Number</label>
                          <input
                            type="text"
                            required
                            pattern="[0-9]{5}-[0-9]{7}-[0-9]{1}"
                            value={cnic}
                            onChange={(e) => setCnic(e.target.value)}
                            placeholder="XXXXX-XXXXXXX-X"
                            className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-xs focus:bg-white focus:outline-none focus:border-[#13BDC4] transition-colors"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="user-fields"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2.5"
                    >
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#334155]">Username</label>
                        <input
                          type="text"
                          required
                          minLength={3}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Your username"
                          className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-xs focus:bg-white focus:outline-none focus:border-[#13BDC4] transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#334155]">Email Address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-xs focus:bg-white focus:outline-none focus:border-[#13BDC4] transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#334155]">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="03XX XXXXXXX"
                          className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-xs focus:bg-white focus:outline-none focus:border-[#13BDC4] transition-colors"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#334155]">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-[#F1F5F9]/70 border border-[#E2E8F0] text-gray-800 text-xs focus:bg-white focus:outline-none focus:border-[#13BDC4] pr-9 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 text-red-600 text-[11px] rounded-lg px-3 py-1.5">
                    {error}
                  </motion.div>
                )}

                {message && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] rounded-lg px-3 py-1.5">
                    {message}
                  </motion.div>
                )}

                <div className="pt-1">
                  <div className="relative flex items-center justify-center mb-2">
                    <div className="w-full border-t border-gray-200" />
                    <span className="absolute bg-[#FAFAFC] px-2 text-[10px] text-gray-400 font-medium">Or</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={googleLoading || loading}
                    className="w-full border border-[#E2E8F0] bg-white hover:bg-gray-50 text-gray-700 py-1.5 sm:py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 transition-all active:scale-[0.99]"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: '#13BDC4' }}
                  className="w-full text-white py-2 rounded-lg font-semibold text-xs sm:text-sm hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-1.5 mt-2 disabled:opacity-70 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-3 text-center">
                <p className="text-xs text-[#64748B]">
                  Already registered?{' '}
                  <Link href="/login" style={{ color: '#13BDC4' }} className="font-semibold hover:underline">
                    Log in
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Links & Language Dropdown */}
        <div className="flex flex-wrap items-center justify-center sm:justify-between md:justify-between lg:justify-start gap-3 sm:gap-26 relative z-20 pt-2.5 mt-3 lg:-mt-4 border-t border-slate-200/40 shrink-0" ref={dropdownRef}>
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold text-[#1E293B] hover:bg-black/5 transition-colors focus:outline-none"
            >
              {language === 'en' ? <USFlag /> : <PKFlag />}
              <span>{language === 'en' ? 'English' : 'اردو'}</span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 mb-1 w-32 rounded-xl bg-white shadow-lg border border-slate-100 py-1 z-50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleLanguageSelect('en')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-left transition-colors ${language === 'en' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <USFlag />
                    <span>English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageSelect('ur')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-left transition-colors ${language === 'ur' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <PKFlag />
                    <span>اردو</span>
                  </button>

                </motion.div>

              )}

            </AnimatePresence>


          </div>
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
        </div>

      </motion.div>
    </div>
  );
}
