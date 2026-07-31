'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, Package, User, LogOut, Languages, ShieldCheck, ChevronDown, Factory, Sparkles, Wrench, Heart } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

interface NavbarProps {
    forceSolid?: boolean;
}

export default function Navbar({ forceSolid = false }: NavbarProps) {
    const { language, toggleLanguage, t } = useLanguage();
    const { user: authUser, isAdmin, loading: authLoading } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [postAdOpen, setPostAdOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<'machines' | 'parts' | null>(null);
    const pathname = usePathname();

    // Only home page has a dark hero — navbar starts transparent there
    const isSolid = forceSolid || isScrolled || pathname !== '/';

    const handleLogout = async () => {
        setUserMenuOpen(false);
        await fetch('/api/auth/logout', { method: 'POST' });
        try {
            const { createClient } = await import('@/lib/supabase/client');
            const client = createClient();
            await client.auth.signOut();
        } catch (e) {}
        window.location.href = '/';
    };

    // Lock body scroll when drawer is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    // Scroll listener for home page transparency
    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            {/* ── Navbar bar ── */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] py-4 text-white transition-all duration-500 ${isSolid
                ? 'bg-[#050505]/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
                : 'bg-transparent'
                }`}>
                <div className="container mx-auto px-6 md:px-8 flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
                        <img src="/logo.png" alt="SanatHub Logo" width={170} height={45} className="h-10 w-30" />
                    </Link>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold relative">
                        <Link href="/buyer" className="hover:text-gray-300 transition-colors">{t('buy_parts')}</Link>

                        {/* Post an Ad with Dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={() => setPostAdOpen(true)}
                            onMouseLeave={() => { setPostAdOpen(false); setHoveredItem(null); }}
                        >
                            <div className="flex items-center gap-1">
                                <Link
                                    href={authLoading ? '#' : (authUser ? "/seller" : `/login?next=${encodeURIComponent('/seller')}`)}
                                    onClick={(e) => { if (authLoading) e.preventDefault(); }}
                                    className="hover:text-gray-300 transition-colors"
                                >
                                    {t('post_ad')}
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setPostAdOpen(!postAdOpen)}
                                    className="hover:text-gray-300 transition-colors"
                                >
                                    <ChevronDown
                                        size={16}
                                        className={`transition-transform duration-300 ${postAdOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* First level dropdown — pt-2 creates invisible bridge so mouse doesn't leave parent */}
                            {postAdOpen && (
                                <div className="absolute top-full left-0 pt-2 w-48 z-50">
                                    <div className="bg-[#000] rounded-2xl border border-white/10 shadow-2xl">

                                        <Link
                                            href={authLoading ? '#' : (authUser ? "/seller?tab=post&category=machines" : `/login?next=${encodeURIComponent('/seller?tab=post&category=machines')}`)}
                                            onClick={(e) => { if (authLoading) e.preventDefault(); }}
                                            className="flex items-center justify-between px-4 py-3.5 text-white hover:bg-white/10 transition-colors rounded-t-2xl border-b border-white/5"
                                        >
                                            <span>Machines</span>
                                        </Link>

                                        <Link
                                            href={authLoading ? '#' : (authUser ? "/seller?tab=post&category=parts" : `/login?next=${encodeURIComponent('/seller?tab=post&category=parts')}`)}
                                            onClick={(e) => { if (authLoading) e.preventDefault(); }}
                                            className="flex items-center justify-between px-4 py-3.5 text-white hover:bg-white/10 transition-colors rounded-b-2xl"
                                        >
                                            <span>Parts</span>
                                        </Link>

                                    </div>
                                </div>
                            )}
                        </div>

                        {isAdmin && (
                            <Link href="/admin/dashboard" className="hover:text-gray-300 transition-colors flex items-center gap-2">
                                <ShieldCheck size={16} /> Admin
                            </Link>
                        )}
                        <Link href="/contact" className="hover:text-gray-300 transition-colors">{t('contact')}</Link>
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden md:flex items-center gap-6">
                        {authUser ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((prev) => !prev)}
                                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold backdrop-blur-md transition-all hover:bg-white/20"
                                >
                                    <User size={18} />
                                    <span className="max-w-[120px] truncate">{authUser.name || authUser.email?.split('@')[0]}</span>
                                    <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 bg-[#050505]/95 p-2 shadow-2xl backdrop-blur-xl">
                                        <Link
                                            href="/profile"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                                        >
                                            <User size={16} className="text-primary" />
                                            Profile
                                        </Link>
                                        <Link
                                            href="/my-ads"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                                        >
                                            <Package size={16} className="text-primary" />
                                            My Ads
                                        </Link>
                                        <Link
                                            href="/saved"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                                        >
                                            <Heart size={16} className="text-primary" />
                                            My Saved Ads
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-amber-400 transition-colors hover:bg-white/10"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-md transition-all hover:bg-white/20">
                                <User size={18} />
                                {t('sign_in')}
                            </Link>
                        )}
                        <button onClick={toggleLanguage} className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-md transition-all hover:bg-white/20">
                            <Languages size={18} />
                            {language === 'en' ? 'اردو' : 'EN'}
                        </button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden text-white p-1"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={26} />
                    </button>
                </div>
            </nav>

            {/* ── Backdrop (outside nav, body-level z-index) ── */}
            <div
                className={`fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setMenuOpen(false)}
            />

            {/* ── Slide drawer (outside nav) ── */}
            <div className={`fixed top-0 right-0 h-full w-[78%] max-w-[320px] z-[210] bg-[#0a0f1c] border-l border-white/10 shadow-2xl flex flex-col md:hidden transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                    <img src="/logo.png" alt="SanatKar" className="h-8 w-auto" />
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Links */}
                <nav className="flex-1 flex flex-col gap-1 px-4 py-6 overflow-y-auto">
                    <Link href="/buyer" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                        <Package size={18} className="text-primary" />
                        {t('buy_parts')}
                    </Link>
                    <Link href="/saved" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                        <Heart size={18} className="text-primary" />
                        My Saved Ads
                    </Link>

                    {/* Mobile Post an Ad Dropdown */}
                    <div className="space-y-1">
                        <Link
                            href={authLoading ? '#' : (authUser ? "/seller?tab=post" : `/login?next=${encodeURIComponent('/seller?tab=post')}`)}
                            onClick={(e) => { setMenuOpen(false); if (authLoading) e.preventDefault(); }}
                            className="block text-xs font-bold text-gray-400 px-4 py-2 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            {t('post_ad')}
                        </Link>
                        <Link
                            href={authLoading ? '#' : (authUser ? "/seller?tab=post&category=machines" : `/login?next=${encodeURIComponent('/seller?tab=post&category=machines')}`)}
                            onClick={(e) => { setMenuOpen(false); if (authLoading) e.preventDefault(); }}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                        >
                            <Package size={18} className="text-primary" />
                            Machines
                        </Link>

                        <Link
                            href={authLoading ? '#' : (authUser ? "/seller?tab=post&category=parts" : `/login?next=${encodeURIComponent('/seller?tab=post&category=parts')}`)}
                            onClick={(e) => { setMenuOpen(false); if (authLoading) e.preventDefault(); }}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                        >
                            <Package size={18} className="text-primary" />
                            Parts
                        </Link>
                    </div>

                    {isAdmin && (
                        <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                            <ShieldCheck size={18} className="text-primary" />
                            Admin Panel
                        </Link>
                    )}
                    <Link href="/contact" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                        <Phone size={18} className="text-primary" />
                        {t('contact_us')}
                    </Link>
                </nav>

                {/* Bottom */}
                <div className="px-4 py-6 border-t border-white/10 flex flex-col gap-3">
                    <button
                        onClick={() => { toggleLanguage(); setMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/80 font-semibold text-sm hover:bg-white/10 transition-colors w-full"
                    >
                        <Languages size={18} className="text-primary" />
                        {language === 'en' ? 'اردو' : 'English'}
                    </button>
                    {authUser ? (
                        <>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                                <User size={18} className="text-primary shrink-0" />
                                <span className="text-sm font-bold text-white truncate">{authUser.name}</span>
                            </div>
                            <button onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-amber-400 font-semibold text-sm hover:bg-amber-500/10 transition-colors w-full">
                                <LogOut size={18} />
                                {t('sign_out')}
                            </button>
                        </>
                    ) : (
                        <Link href="/login" onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-primary-dark transition-colors">
                            <User size={18} />
                            {t('sign_in')}
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}