'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, Package, User, LogOut, Languages, ShieldCheck, ChevronDown, Heart, MessageSquare, Store } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/auth/supabase/client';

interface NavbarProps {
    forceSolid?: boolean;
}

export default function Navbar({ forceSolid = false }: NavbarProps) {
    const { language, toggleLanguage, t } = useLanguage();
    const { user: authUser, isAdmin, loading: authLoading } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [postAdOpen, setPostAdOpen] = useState(false);
    const [messageUnreadCount, setMessageUnreadCount] = useState(0);
    const pathname = usePathname();

    const handleLogout = async () => {
        setUserMenuOpen(false);
        await fetch('/api/auth/logout', { method: 'POST' });
        try {
            const { createClient } = await import('@/lib/auth/supabase/client');
            const client = createClient();
            await client.auth.signOut();
        } catch (e) {}
        window.location.href = '/';
    };

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    useEffect(() => {
        if (!authUser?.id) {
            setMessageUnreadCount(0);
            return;
        }

        let isActive = true;

        const fetchUnreadMessageCount = async () => {
            try {
                const supabase = createClient();
                const { count, error } = await supabase
                    .from('messages')
                    .select('id', { count: 'exact', head: true })
                    .neq('sender_id', authUser.id)
                    .eq('is_read', false);

                if (!isActive) return;

                if (!error) {
                    setMessageUnreadCount(count ?? 0);
                }
            } catch (error) {
                if (isActive) {
                    setMessageUnreadCount(0);
                }
            }
        };

        fetchUnreadMessageCount();

        return () => {
            isActive = false;
        };
    }, [authUser?.id]);

    return (
        <>
            <nav className="hidden lg:block absolute top-0 left-0 right-0 z-[100] py-0 px-2 bg-white/40 backdrop-blur-xl border-b border-white/30 text-slate-900 shadow-sm">
                <div className="container-wide flex justify-between items-center h-16">
                    
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95 shrink-0 z-10">
                        <img src="/sanatkar.png" alt="SanatHub Logo" className="h-8 sm:h-10 w-auto object-contain" />
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold tracking-wide">
                        <Link 
                            href="/buyer" 
                            className="text-slate-800 hover:text-[#09ACC9] transition-colors whitespace-nowrap py-2 px-1"
                        >
                            {t('buy_parts')}
                        </Link>

                        <Link 
                            href="/shops" 
                            className="text-slate-800 hover:text-[#09ACC9] transition-colors whitespace-nowrap py-2 px-1"
                        >
                            {t('shop_directory')}
                        </Link>

                        {/* Post Ad Dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={() => setPostAdOpen(true)}
                            onMouseLeave={() => setPostAdOpen(false)}
                        >
                            <div className="flex items-center gap-1.5 cursor-pointer">
                                <Link
                                    href={authLoading ? '#' : (authUser ? "/seller" : `/login?next=${encodeURIComponent('/seller')}`)}
                                    onClick={(e) => { if (authLoading) e.preventDefault(); }}
                                    className="text-slate-800 hover:text-[#09ACC9] transition-colors whitespace-nowrap py-2"
                                >
                                    {t('post_ad')}
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setPostAdOpen(!postAdOpen)}
                                    className="text-slate-800 hover:text-[#09ACC9] transition-colors p-1"
                                >
                                </button>
                            </div>
                        </div>

                        {isAdmin && (
                            <Link 
                                href="/admin/dashboard" 
                                className="flex items-center gap-2 text-slate-800 hover:text-[#09ACC9] transition-colors whitespace-nowrap py-2 px-1"
                            >
                                <ShieldCheck size={16} className="text-[#09ACC9]" /> {t('admin')}
                            </Link>
                        )}
                        <Link 
                            href="/contact" 
                            className="text-slate-800 hover:text-[#09ACC9] transition-colors whitespace-nowrap py-2 px-1"
                        >
                            {t('contact')}
                        </Link>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        {authUser ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((prev) => !prev)}
                                    className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all shadow-sm border border-slate-300/80 bg-white/80 hover:bg-white text-slate-800 hover:shadow-md"
                                >
                                    <User size={16} className="text-[#09ACC9]" />
                                    <span className="max-w-[100px] truncate">{authUser.name || authUser.email?.split('@')[0] || 'User'}</span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* User Dropdown */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/60 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl text-slate-800 z-50">
                                        {authUser.role === 'regular' ? (
                                            <div className="px-3 py-2 mb-1 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="text-xs font-semibold text-slate-500 mb-1">Listings Quota</div>
                                                <div className="text-sm font-bold text-slate-800">
                                                    {(authUser.total_listings_posted ?? 0)} of 5 used
                                                </div>
                                                {(authUser.total_listings_posted ?? 0) >= 5 && (
                                                    <div className="text-xs text-rose-500 mt-0.5 font-medium">
                                                        Limit reached
                                                    </div>
                                                )}
                                            </div>
                                        ) : authUser.role === 'seller' ? (
                                            <div className="px-3 py-2 mb-1 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="text-xs font-semibold text-slate-500 mb-1">Total Listings</div>
                                                <div className="text-sm font-bold text-slate-800">
                                                    {(authUser.total_listings_posted ?? 0)} posted
                                                </div>
                                            </div>
                                        ) : null}
                                        <Link
                                            href="/profile"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-[#09ACC9]/10 hover:text-[#09ACC9]"
                                        >
                                            <User size={16} className="text-[#09ACC9]" />
                                            {t('profile')}
                                        </Link>
                                        <Link
                                            href="/my-ads"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-[#09ACC9]/10 hover:text-[#09ACC9]"
                                        >
                                            <Package size={16} className="text-[#09ACC9]" />
                                            {t('my_ads')}
                                        </Link>
                                        {authUser.role === 'seller' && (
                                            <Link
                                                href="/my-shop"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-[#09ACC9]/10 hover:text-[#09ACC9]"
                                            >
                                                <Store size={16} className="text-[#09ACC9]" />
                                                {t('my_shop')}
                                            </Link>
                                        )}
                                        <Link
                                            href="/saved"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-[#09ACC9]/10 hover:text-[#09ACC9]"
                                        >
                                            <Heart size={16} className="text-[#09ACC9]" />
                                            {t('saved_ads')}
                                        </Link>
                                        <Link
                                            href="/messages"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-[#09ACC9]/10 hover:text-[#09ACC9]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <MessageSquare size={16} className="text-[#09ACC9]" />
                                                <span>{t('messages')}</span>
                                            </div>
                                            {messageUnreadCount > 0 && (
                                                <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                                                    {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                                                </span>
                                            )}
                                        </Link>
                                        <div className="my-1 border-t border-slate-200/60" />
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-500/10"
                                        >
                                            <LogOut size={16} />
                                            {t('sign_out')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link 
                                href="/login" 
                                className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all shadow-sm border border-slate-300/80 bg-white/80 hover:bg-white text-slate-800 hover:shadow-md"
                            >
                                <User size={16} className="text-[#09ACC9]" />
                                {t('sign_in')}
                            </Link>
                        )}
                        
                        <button 
                            onClick={toggleLanguage} 
                            className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all shadow-sm border border-slate-300/80 bg-white/80 hover:bg-white text-slate-800 hover:shadow-md"
                        >
                            <Languages size={16} className="text-[#09ACC9]" />
                            {language === 'en' ? 'اردو' : 'EN'}
                        </button>
                    </div>

                    {/* Mobile Actions (visible on md and smaller) */}
                    <div className="flex lg:hidden items-center gap-2">
                        {/* Language Toggle for Mobile */}
                        <button 
                            onClick={toggleLanguage} 
                            className="flex items-center justify-center w-10 h-10 rounded-full text-slate-800 hover:bg-black/5 transition-colors"
                        >
                            <Languages size={20} />
                        </button>

                        {/* User Button for Tablet */}
                        {authUser && (
                            <div className="relative hidden md:block lg:hidden">
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((prev) => !prev)}
                                    className="flex items-center justify-center w-10 h-10 rounded-full text-slate-800 hover:bg-black/5 transition-colors"
                                >
                                    <User size={20} />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/60 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl text-slate-800 z-50">
                                        {authUser.role === 'regular' ? (
                                            <div className="px-3 py-2 mb-1 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="text-xs font-semibold text-slate-500 mb-1">Listings Quota</div>
                                                <div className="text-sm font-bold text-slate-800">
                                                    {(authUser.total_listings_posted ?? 0)} of 5 used
                                                </div>
                                                {(authUser.total_listings_posted ?? 0) >= 5 && (
                                                    <div className="text-xs text-rose-500 mt-0.5 font-medium">
                                                        Limit reached
                                                    </div>
                                                )}
                                            </div>
                                        ) : authUser.role === 'seller' ? (
                                            <div className="px-3 py-2 mb-1 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="text-xs font-semibold text-slate-500 mb-1">Total Listings</div>
                                                <div className="text-sm font-bold text-slate-800">
                                                    {(authUser.total_listings_posted ?? 0)} posted
                                                </div>
                                            </div>
                                        ) : null}
                                        <Link
                                            href="/profile"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-[#09ACC9]/10 hover:text-[#09ACC9]"
                                        >
                                            <User size={16} className="text-[#09ACC9]" />
                                            {t('profile')}
                                        </Link>
                                        <Link
                                            href="/my-ads"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-[#09ACC9]/10 hover:text-[#09ACC9]"
                                        >
                                            <Package size={16} className="text-[#09ACC9]" />
                                            {t('my_ads')}
                                        </Link>
                                        {authUser.role === 'seller' && (
                                            <Link
                                                href="/my-shop"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-[#09ACC9]/10 hover:text-[#09ACC9]"
                                            >
                                                <Store size={16} className="text-[#09ACC9]" />
                                                {t('my_shop')}
                                            </Link>
                                        )}
                                        <Link
                                            href="/saved"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-[#09ACC9]/10 hover:text-[#09ACC9]"
                                        >
                                            <Heart size={16} className="text-[#09ACC9]" />
                                            {t('saved_ads')}
                                        </Link>
                                        <Link
                                            href="/messages"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-[#09ACC9]/10 hover:text-[#09ACC9]"
                                        >
                                            <MessageSquare size={16} className="text-[#09ACC9]" />
                                            Messages
                                        </Link>
                                        <div className="my-1 border-t border-slate-200/60" />
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-500/10"
                                        >
                                            <LogOut size={16} />
                                            {t('sign_out')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu Icon */}
                        <button
                            className="flex items-center justify-center w-10 h-10 rounded-full text-slate-800 hover:bg-black/5 transition-colors"
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer with Overlay */}
            <div
                className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setMenuOpen(false)}
            />

            <div className={`fixed top-0 right-0 h-full w-[85%] sm:w-[350px] z-[210] bg-white/95 backdrop-blur-2xl border-l border-white/50 shadow-2xl flex flex-col lg:hidden transition-transform duration-300 ease-out text-slate-900 ${menuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                
                {/* Mobile Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60">
                    <img src="/sanatkar.png" alt="SanatKar" className="h-8 w-auto" />
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 flex flex-col gap-1 px-4 py-6 overflow-y-auto">
                    <Link href="/buyer" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors">
                        <Package size={20} className="text-[#09ACC9]" />
                        {t('buy_parts')}
                    </Link>
                    
                    <Link href="/shops" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors">
                        <Store size={20} className="text-[#09ACC9]" />
                        {t('shop_directory')}
                    </Link>

                    <Link href="/contact" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors">
                        <Phone size={20} className="text-[#09ACC9]" />
                        {t('contact')}
                    </Link>

                    {authUser && (
                        <>
                            <div className="border-t border-slate-200/60 my-2"></div>
                            
                            {authUser.role === 'regular' ? (
                                <div className="px-4 py-3 mx-2 my-2 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 mb-1">Listings Quota</div>
                                    <div className="text-sm font-bold text-slate-800">
                                        {(authUser.total_listings_posted ?? 0)} of 5 used
                                    </div>
                                    {(authUser.total_listings_posted ?? 0) >= 5 && (
                                        <div className="text-xs text-rose-500 mt-0.5 font-medium">
                                            Limit reached
                                        </div>
                                    )}
                                </div>
                            ) : authUser.role === 'seller' ? (
                                <div className="px-4 py-3 mx-2 my-2 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 mb-1">Total Listings</div>
                                    <div className="text-sm font-bold text-slate-800">
                                        {(authUser.total_listings_posted ?? 0)} posted
                                    </div>
                                </div>
                            ) : null}

                            <Link href="/profile" onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors">
                                <User size={20} className="text-[#09ACC9]" />
                                Profile
                            </Link>
                            
                            <Link href="/my-ads" onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors">
                                <Package size={20} className="text-[#09ACC9]" />
                                My Ads
                            </Link>
                            
                            <Link href="/saved" onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors">
                                <Heart size={20} className="text-[#09ACC9]" />
                                Saved Ads
                            </Link>

                            {authUser?.role === 'seller' && (
                                <Link href="/my-shop" onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors">
                                    <Store size={20} className="text-[#09ACC9]" />
                                    My Shop
                                </Link>
                            )}
                            
                            <Link href="/messages" onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-between gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors">
                                <div className="flex items-center gap-3">
                                    <MessageSquare size={20} className="text-[#09ACC9]" />
                                    <span>Messages</span>
                                </div>
                                {messageUnreadCount > 0 && (
                                    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                                        {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                                    </span>
                                )}
                            </Link>
                        </>
                    )}

                    <div className="border-t border-slate-200/60 my-2"></div>
                    
                    {/* Post Ad Section */}
                    <div className="space-y-1">
                        <div className="block text-xs font-bold text-slate-400 px-4 py-2 uppercase tracking-wider">
                            {t('post_ad')}
                        </div>
                        <Link
                            href={authLoading ? '#' : (authUser ? "/seller?tab=post&category=machines" : `/login?next=${encodeURIComponent('/seller?tab=post&category=machines')}`)}
                            onClick={(e) => { setMenuOpen(false); if (authLoading) e.preventDefault(); }}
                            className="flex items-center gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors"
                        >
                            <Package size={18} className="text-[#09ACC9]" />
                            Machines
                        </Link>
                        <Link
                            href={authLoading ? '#' : (authUser ? "/seller?tab=post&category=parts" : `/login?next=${encodeURIComponent('/seller?tab=post&category=parts')}`)}
                            onClick={(e) => { setMenuOpen(false); if (authLoading) e.preventDefault(); }}
                            className="flex items-center gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors"
                        >
                            <Package size={18} className="text-[#09ACC9]" />
                            Parts
                        </Link>
                    </div>

                    {isAdmin && (
                        <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-4 rounded-xl font-semibold text-sm hover:bg-[#09ACC9]/10 hover:text-[#09ACC9] transition-colors">
                            <ShieldCheck size={20} className="text-[#09ACC9]" />
                            {t('admin_panel')}
                        </Link>
                    )}
                </nav>

                {/* Mobile Footer Actions */}
                <div className="border-t border-slate-200/60 p-4">
                    {authUser ? (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    ) : (
                        <>
                            <Link href="/login" onClick={() => setMenuOpen(false)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#09ACC9] hover:bg-[#0092b8] text-white font-semibold rounded-xl transition-colors mb-3">
                                <User size={18} />
                                {t('sign_in')}
                            </Link>
                            <Link href="/signup" onClick={() => setMenuOpen(false)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#09ACC9] text-[#09ACC9] hover:bg-[#09ACC9]/10 font-semibold rounded-xl transition-colors">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}