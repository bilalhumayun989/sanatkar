'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Phone, Package, Search, User, ChevronDown, LogOut, Languages, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar({ forceSolid = false }: { forceSolid?: boolean } = {}) {
    const { language, toggleLanguage, t } = useLanguage();
    const { user: authUser, isAdmin, refreshAuth } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [adDropdown, setAdDropdown] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.reload();
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${(scrolled || forceSolid) ? 'glass py-2 shadow-premium' : 'bg-transparent py-6'
            }`}>
            <div className="container-wide">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
                        <div className="bg-primary p-2.5 rounded-2xl group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-primary/20">
                            <Package size={26} className="text-white" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-2xl font-black tracking-tighter text-secondary">{t('brand_name_1')}<span className="text-primary">{t('brand_name_2')}</span></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t('tagline')}</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-10">
                        <nav className="flex items-center gap-8">
                            <Link href="/buyer" className="link-underline text-sm font-bold flex items-center gap-1">
                                {t('buy_parts')} <ChevronDown size={14} />
                            </Link>
                            {isAdmin && (
                                <div
                                    className="relative group"
                                    onMouseEnter={() => setAdDropdown(true)}
                                    onMouseLeave={() => setAdDropdown(false)}
                                >
                                    <button className="link-underline text-sm font-bold flex items-center gap-1 whitespace-nowrap">
                                        {t('post_ad')} <ChevronDown size={14} className={`transition-transform duration-300 ${adDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-300 z-50 ${adDropdown ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-2 invisible'}`}>
                                        {/* Pointer Arrow */}
                                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-t border-l border-gray-100 z-0"></div>

                                        <div className="relative bg-white rounded-3xl shadow-2xl shadow-secondary/10 border border-gray-100 p-3 min-w-[280px] backdrop-blur-xl">
                                            <Link
                                                href="/seller"
                                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/5 group/item transition-all duration-300"
                                                onClick={() => setAdDropdown(false)}
                                            >
                                                <div className="w-12 h-12 rounded-[1rem] bg-primary/10 text-primary flex items-center justify-center group-hover/item:bg-primary group-hover/item:text-white group-hover/item:scale-110 transition-all duration-300 shadow-sm">
                                                    <Package size={22} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-secondary group-hover/item:text-primary transition-colors">{t('sell_parts')}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mt-0.5">{t('classified_free')}</p>
                                                </div>
                                            </Link>

                                            <div className="h-px bg-gray-50 my-2 mx-4"></div>

                                            <Link
                                                href="/ads/promote"
                                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/5 group/item transition-all duration-300"
                                                onClick={() => setAdDropdown(false)}
                                            >
                                                <div className="w-12 h-12 rounded-[1rem] bg-secondary/5 text-secondary flex items-center justify-center group-hover/item:bg-secondary group-hover/item:text-white group-hover/item:scale-110 transition-all duration-300 shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-megaphone"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-secondary group-hover/item:text-primary transition-colors">{t('promote_brand')}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mt-0.5">{t('in_feed_paid')}</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isAdmin && (
                                <Link href="/admin/dashboard" className="link-underline text-sm font-bold flex items-center gap-2 text-primary">
                                    <ShieldCheck size={16} /> Admin
                                </Link>
                            )}

                            <Link href="/contact" className="link-underline text-sm font-bold">
                                {t('contact')}
                            </Link>
                        </nav>

                        <div className="h-6 w-[px] bg-gray-200/50"></div>

                        <div className="flex items-center gap-4">
                            <button className="text-secondary hover:text-primary transition-all p-2.5 rounded-xl hover:bg-primary/5 active:scale-90">
                                <Search size={20} />
                            </button>
                            {authUser ? (
                                <div className="flex items-center gap-3 bg-secondary/5 px-4 py-2 rounded-2xl border border-secondary/10">
                                    <span className="text-sm font-bold text-secondary max-w-[100px] truncate">{authUser.name}</span>
                                    <button onClick={handleLogout} className="text-red-500 hover:text-red-600 transition-colors bg-white p-1.5 rounded-lg shadow-sm" title={t('sign_out')}>
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            ) : (
                                <Link href="/login" className="flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95">
                                    <User size={18} /> {t('sign_in')}
                                </Link>
                            )}

                            <button 
                                onClick={toggleLanguage}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-primary/20 text-primary font-black text-xs hover:bg-primary hover:text-white transition-all duration-300 active:scale-95"
                            >
                                <Languages size={14} />
                                {language === 'en' ? 'اردو' : 'English'}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-3">
                        {authUser ? (
                            <button onClick={handleLogout} className="p-2.5 text-red-500 bg-red-50 rounded-xl">
                                <LogOut size={22} />
                            </button>
                        ) : (
                            <Link href="/login" className="p-2.5 text-secondary bg-muted rounded-xl">
                                <User size={22} />
                            </Link>
                        )}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-all active:scale-90"
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`fixed inset-0 top-[72px] bg-white/95 backdrop-blur-xl z-[90] transition-all duration-500 md:hidden ${menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-[10%] opacity-0 pointer-events-none'
                }`}>
                <div className="p-8 flex flex-col gap-8 h-full overflow-y-auto">
                    <div className="space-y-4">
                        <Link
                            href="/buyer"
                            className="flex items-center justify-between text-xl font-extrabold text-secondary p-5 rounded-3xl bg-muted/80 border border-border/50 hover:bg-muted transition-colors"
                            onClick={() => setMenuOpen(false)}
                        >
                            {t('buy_parts')} <ChevronDown size={20} className="text-primary" />
                        </Link>

                        {isAdmin && (
                            <>
                                {/* Classified Ad */}
                                <Link
                                    href="/seller"
                                    className="flex items-center gap-5 text-lg font-black text-secondary p-5 rounded-3xl bg-muted/80 border border-border/50 hover:bg-muted transition-colors"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <p>{t('sell_parts')}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('standard_classified')}</p>
                                    </div>
                                </Link>

                                {/* Promoted Ad */}
                                <Link
                                    href="/ads/promote"
                                    className="flex items-center gap-5 text-lg font-black text-secondary p-5 rounded-3xl bg-muted/80 border border-border/50 hover:bg-muted transition-colors"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-megaphone"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
                                    </div>
                                    <div>
                                        <p>{t('promote_brand')}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('in_feed_placement')}</p>
                                    </div>
                                </Link>
                            </>
                        )}

                        <Link
                            href="/contact"
                            className="block text-xl font-extrabold text-secondary p-5 rounded-3xl hover:bg-muted transition-colors"
                            onClick={() => setMenuOpen(false)}
                        >
                            {t('contact_us')}
                        </Link>
                    </div>

                    <div className="mt-auto space-y-6 pb-12">
                        <div className="flex items-center gap-4 p-5 rounded-3xl border border-border/50 bg-secondary/5">
                            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                                <Phone size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('need_help')}</p>
                                <p className="font-black text-secondary text-lg">0800-SANAT-KAR</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { toggleLanguage(); setMenuOpen(false); }}
                            className="flex items-center justify-center gap-3 w-full bg-secondary text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-secondary/30 transition-all active:scale-95"
                        >
                            <Languages size={24} />
                            {language === 'en' ? 'اردو' : 'English'}
                        </button>
                        {isAdmin && (
                            <div className="flex flex-col gap-3 w-full">
                                <Link
                                    href="/seller"
                                    className="flex items-center justify-center gap-2 w-full bg-primary text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-primary/30 transition-all active:scale-95"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {t('post_ad_free')}
                                </Link>
                                <Link
                                    href="/admin/dashboard"
                                    className="flex items-center justify-center gap-2 w-full bg-secondary text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-secondary/30 transition-all active:scale-95 border-2 border-primary/20"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <ShieldCheck size={24} /> Admin Panel
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
